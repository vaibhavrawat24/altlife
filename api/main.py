from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import SimulateRequest
from simulation.orchestrator import SimulationOrchestrator
from services.llm import get_llm_provider_status
from services.supabase import (
    check_rate_limit,
    record_rate_limit,
    store_simulation,
    store_user_input,
    get_simulation,
    check_login_bonus,
    use_login_bonus,
    signup_with_email_password,
    login_with_email_password,
    get_user_from_token,
    grant_login_bonus,
    upsert_profile,
    get_user_history,
    get_all_users,
    get_anonymous_history,
)
import os
import json
import time

app = FastAPI(title="Altlife Simulation Engine")


def get_client_ip(request: Request) -> str:
    """Extract client IP, accounting for proxies."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def get_request_user(request: Request) -> tuple[dict, str | None]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {}, None

    token = auth_header.split(" ", 1)[1]
    return get_user_from_token(token) or {}, token


def require_admin(request: Request) -> dict:
    user, _ = get_request_user(request)
    if not user.get("id"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not user.get("email"):
        raise HTTPException(status_code=401, detail="Unauthorized")

    from services.supabase import is_admin_email

    if not is_admin_email(user.get("email")):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


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
    client_ip = get_client_ip(request)
    auth_user, _ = get_request_user(request)
    user_id = auth_user.get("id")  # Always use verified identity, never trust query params
    user_email = auth_user.get("email")
    
    # Check normal rate limit first
    allowed, wait_seconds, can_login = check_rate_limit(user_id, client_ip, user_email)

    # If blocked and authenticated, allow exactly one login bonus bypass
    if not allowed and user_id and use_login_bonus(user_id):
        allowed, wait_seconds, can_login = True, 0, False
    
    if not allowed:
        message = f"Please wait {wait_seconds} seconds before running another simulation"
        if can_login:
            message += " or login to get one free simulation"
        raise HTTPException(
            status_code=429,
            detail=message,
            headers={"X-Wait-Seconds": str(wait_seconds), "X-Can-Login": str(can_login)},
        )
    
    # Record this simulation
    record_rate_limit(user_id, client_ip)

    # Store submitted input snapshot
    store_user_input(
        user_id=user_id,
        ip_address=client_ip,
        form_data={
            "profile": req.profile,
            "decision": req.decision,
        },
    )
    
    async def event_generator():
        orchestrator = SimulationOrchestrator(req.profile, req.decision)
        latest_nodes = []
        latest_edges = []
        latest_timeline = []
        latest_reality = None
        latest_synthesis = None
        try:
            async for event_json in orchestrator.run_streaming():
                try:
                    parsed = json.loads(event_json)
                    event_type = parsed.get("type")
                    event_data = parsed.get("data", {})

                    if event_type == "graph_ready":
                        latest_nodes = event_data.get("nodes", latest_nodes)
                        latest_edges = event_data.get("edges", latest_edges)
                    elif event_type == "interaction_edges":
                        # merge interaction edges by id
                        existing = {e.get("id"): e for e in latest_edges if isinstance(e, dict) and e.get("id")}
                        for edge in event_data.get("edges", []):
                            edge_id = edge.get("id") if isinstance(edge, dict) else None
                            if edge_id:
                                existing[edge_id] = edge
                            elif isinstance(edge, dict):
                                latest_edges.append(edge)
                        latest_edges = list(existing.values()) + [e for e in latest_edges if not isinstance(e, dict) or not e.get("id")]
                    elif event_type == "timeline_ready":
                        latest_timeline = event_data.get("events", latest_timeline)
                    elif event_type == "reality_checked":
                        latest_reality = event_data
                    elif event_type == "synthesis_complete":
                        latest_synthesis = event_data
                except Exception:
                    pass

                yield f"data: {event_json}\n\n"

            # Auto-save completed simulation once stream is done
            if latest_synthesis:
                try:
                    store_simulation(
                        user_id=user_id,
                        ip_address=client_ip,
                        profile=req.profile,
                        decision=req.decision,
                        synthesis=latest_synthesis,
                        nodes=latest_nodes,
                        edges=latest_edges,
                        timeline=latest_timeline,
                        reality=latest_reality,
                    )
                except Exception as persist_error:
                    print(f"[API] Failed to auto-save simulation: {persist_error}")
        except Exception as e:
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
async def create_share(data: dict, request: Request):
    """Store simulation data and return share_id."""
    auth_user, _ = get_request_user(request)
    user_id = auth_user.get("id")
    client_ip = get_client_ip(request)
    
    share_id = store_simulation(
        user_id=user_id,
        ip_address=client_ip,
        profile=data.get("profile", ""),
        decision=data.get("decision", ""),
        synthesis=data.get("synthesis", {}),
        nodes=data.get("nodes", []),
        edges=data.get("edges", []),
        timeline=data.get("timeline", []),
        reality=data.get("reality"),
    )
    
    return {"id": share_id}


@app.get("/share/{share_id}")
async def fetch_share(share_id: str):
    """Retrieve simulation data by share_id."""
    data = get_simulation(share_id)
    if not data:
        raise HTTPException(status_code=404, detail="Share not found")
    return data


@app.post("/auth/signup")
async def signup(email: str = Form(...), password: str = Form(...), request: Request = None):
    """Sign up with Supabase Auth."""
    try:
        response = signup_with_email_password(email, password)
        if not response:
            raise HTTPException(status_code=400, detail="Signup failed")

        user = response.get("user") or {}
        session = response.get("session") or {}
        
        # Grant login bonus
        if user.get("id"):
            upsert_profile(user["id"], user.get("email"), "email")
            grant_login_bonus(user["id"])
        
        return {
            "user_id": user.get("id"),
            "email": user.get("email"),
            "session": session.get("access_token")
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Signup failed")


@app.post("/auth/login")
async def login(email: str = Form(...), password: str = Form(...)):
    """Login with Supabase Auth and grant login bonus."""
    try:
        response = login_with_email_password(email, password)
        if not response:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = response.get("user") or {}
        session = response.get("session") or {}
        
        # Grant login bonus for this login
        if user.get("id"):
            upsert_profile(user["id"], user.get("email"), "email")
            grant_login_bonus(user["id"])
        
        return {
            "user_id": user.get("id"),
            "email": user.get("email"),
            "session": session.get("access_token")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/auth/oauth-callback")
async def oauth_callback(request: Request):
    """Handle OAuth callback - grant login bonus."""
    # Verify identity from the bearer token, never trust the request body
    user, _ = get_request_user(request)
    user_id = user.get("id")
    email = user.get("email")

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        upsert_profile(user_id, email, "google")
        grant_login_bonus(user_id)
        return {
            "user_id": user_id,
            "email": email,
            "message": "OAuth login successful"
        }
    except Exception:
        raise HTTPException(status_code=500, detail="OAuth callback failed")


@app.get("/auth/me")
async def get_current_user(request: Request):
    """Get current authenticated user."""
    try:
        user, _ = get_request_user(request)
        
        # Get remaining login bonus
        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        upsert_profile(user_id, user.get("email"), "auth")
        bonus = check_login_bonus(user_id)
        from services.supabase import is_admin_email
        
        return {
            "user_id": user_id,
            "email": user.get("email"),
            "login_bonus_remaining": bonus,
            "is_admin": is_admin_email(user.get("email")),
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/history")
async def get_history(request: Request, limit: int = 20):
    """Get recent simulations for the authenticated user."""
    user, _ = get_request_user(request)
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    safe_limit = max(1, min(limit, 100))
    items = get_user_history(user_id, safe_limit)
    return {"items": items}


@app.get("/admin/users")
async def admin_users(request: Request, limit: int = 100):
    """Get all known users for the admin dashboard."""
    require_admin(request)
    safe_limit = max(1, min(limit, 200))
    return {"items": get_all_users(safe_limit)}


@app.get("/admin/users/{user_id}/simulations")
async def admin_user_simulations(user_id: str, request: Request, limit: int = 50):
    """Get simulations for a selected user."""
    require_admin(request)
    safe_limit = max(1, min(limit, 100))
    if user_id == "__anonymous__":
        return {"items": get_anonymous_history(safe_limit)}
    return {"items": get_user_history(user_id, safe_limit)}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/debug/llm-provider")
async def debug_llm_provider(request: Request):
    """Debug endpoint: show configured LLM provider chain and last successful provider used."""
    require_admin(request)
    return get_llm_provider_status()
