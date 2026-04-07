from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import SimulateRequest
from simulation.orchestrator import SimulationOrchestrator
from services.store import save_share, get_share
import time

app = FastAPI(title="Altlife Simulation Engine")

# ── Rate limiting storage (IP -> last_request_time) ──────────
# In production, use Redis instead of in-memory dict
RATE_LIMIT_CACHE = {}
RATE_LIMIT_SECONDS = 15 * 60  # 15 minutes

def get_client_ip(request: Request) -> str:
    """Extract client IP, accounting for proxies."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def check_rate_limit(ip: str) -> tuple[bool, int]:
    """
    Check if IP has hit rate limit.
    Returns (allowed: bool, seconds_until_next: int)
    """
    now = time.time()
    last_request = RATE_LIMIT_CACHE.get(ip)
    
    if last_request is None:
        return True, 0
    
    elapsed = now - last_request
    if elapsed < RATE_LIMIT_SECONDS:
        wait_time = RATE_LIMIT_SECONDS - elapsed
        return False, int(wait_time)
    
    return True, 0

def record_simulation(ip: str):
    """Record when this IP last ran a simulation."""
    RATE_LIMIT_CACHE[ip] = time.time()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/simulate/stream")
async def simulate_stream(req: SimulateRequest, request: Request):
    """
    SSE streaming endpoint. Emits JSON events as each agent completes.

    Event types:
      profile_extracted  — structured profile from user input
      agents_selected    — which agents were chosen for this domain
      agent_complete     — one agent finished a round
      round_complete     — all agents finished a round
      synthesis_complete — final synthesizer output
    """
    # Check rate limit
    client_ip = get_client_ip(request)
    allowed, wait_seconds = check_rate_limit(client_ip)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {wait_seconds} seconds before running another simulation",
            headers={"X-Wait-Seconds": str(wait_seconds)},
        )
    
    # Record this simulation
    record_simulation(client_ip)
    
    async def event_generator():
        orchestrator = SimulationOrchestrator(req.profile, req.decision)
        try:
            async for event_json in orchestrator.run_streaming():
                yield f"data: {event_json}\n\n"
        except Exception as e:
            import json
            import traceback
            print("[API] /simulate/stream ERROR")
            print(traceback.format_exc())
            yield f"data: {json.dumps({'type': 'error', 'data': {'message': str(e)}})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/share")
async def create_share(data: dict):
    share_id = save_share(data)
    return {"id": share_id}


@app.get("/share/{share_id}")
async def fetch_share(share_id: str):
    data = get_share(share_id)
    if not data:
        raise HTTPException(status_code=404, detail="Share not found")
    return data


@app.get("/health")
async def health():
    return {"status": "ok"}
