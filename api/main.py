from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import SimulateRequest
from simulation.orchestrator import SimulationOrchestrator
from services.store import save_share, get_share

app = FastAPI(title="Altlife Simulation Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/simulate/stream")
async def simulate_stream(req: SimulateRequest):
    """
    SSE streaming endpoint. Emits JSON events as each agent completes.

    Event types:
      profile_extracted  — structured profile from user input
      agents_selected    — which agents were chosen for this domain
      agent_complete     — one agent finished a round
      round_complete     — all agents finished a round
      synthesis_complete — final synthesizer output
    """
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
