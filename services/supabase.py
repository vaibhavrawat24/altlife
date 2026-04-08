import os
import json
from datetime import datetime, timedelta
import httpx
from typing import Optional, Dict, Any

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Use httpx to make REST calls to Supabase
# This avoids heavy dependencies like storage3/pyiceberg
DB_KEY = SUPABASE_SERVICE_ROLE or SUPABASE_KEY
HEADERS = {
    "apikey": DB_KEY,
    "Authorization": f"Bearer {DB_KEY}",
    "Content-Type": "application/json",
}

AUTH_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

AUTH_URL = f"{SUPABASE_URL}/auth/v1"
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv("ADMIN_EMAILS", "").split(",")
    if email.strip()
}

RATE_LIMIT_SECONDS = 15 * 60  # 15 minutes
FREE_LOGIN_BONUS = 1  # Extra simulations granted per login


def _make_request(method: str, table: str, **kwargs) -> Optional[Dict[str, Any]]:
    """Helper to make REST requests to Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    request_headers = {**HEADERS, **kwargs.pop("headers", {})}
    
    try:
        with httpx.Client() as client:
            response = client.request(method, url, headers=request_headers, **kwargs)
            if response.status_code >= 400:
                print(f"[Supabase] Error {response.status_code}: {response.text}")
                return None
            return response.json() if response.text else None
    except Exception as e:
        print(f"[Supabase] Request error: {e}")
        return None


def _auth_request(method: str, path: str, **kwargs) -> Optional[Dict[str, Any]]:
    """Helper to make REST requests to Supabase Auth."""
    url = f"{AUTH_URL}{path}"
    request_headers = {**AUTH_HEADERS, **kwargs.pop("headers", {})}

    try:
        with httpx.Client() as client:
            response = client.request(method, url, headers=request_headers, **kwargs)
            if response.status_code >= 400:
                print(f"[Supabase Auth] Error {response.status_code}: {response.text}")
                return None
            return response.json() if response.text else None
    except Exception as e:
        print(f"[Supabase Auth] Request error: {e}")
        return None


def signup_with_email_password(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Create a Supabase Auth user with email/password."""
    return _auth_request(
        "POST",
        "/signup",
        json={"email": email, "password": password},
    )


def login_with_email_password(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Sign in a Supabase Auth user with email/password."""
    return _auth_request(
        "POST",
        "/token?grant_type=password",
        json={"email": email, "password": password},
    )


def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    """Fetch the current Supabase user for a bearer token."""
    try:
        with httpx.Client() as client:
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
            response = client.get(f"{AUTH_URL}/user", headers=headers)
            if response.status_code >= 400:
                print(f"[Supabase Auth] Error {response.status_code}: {response.text}")
                return None
            return response.json() if response.text else None
    except Exception as e:
        print(f"[Supabase Auth] Request error: {e}")
        return None


def upsert_profile(user_id: str, email: Optional[str], provider: str) -> None:
    """Create or update a row in profiles for the authenticated user."""
    try:
        now = datetime.utcnow().isoformat()
        data = {
            "user_id": user_id,
            "email": email,
            "auth_provider": provider,
            "last_login_at": now,
            "updated_at": now,
        }
        with httpx.Client() as client:
            lookup_url = f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_id}&select=user_id"
            lookup_response = client.get(lookup_url, headers=HEADERS)

            if lookup_response.status_code >= 400:
                print(f"[Supabase] Profile lookup error {lookup_response.status_code}: {lookup_response.text}")
                return

            if lookup_response.json():
                update_url = f"{SUPABASE_URL}/rest/v1/profiles?user_id=eq.{user_id}"
                response = client.patch(
                    update_url,
                    headers=HEADERS,
                    json=data,
                )
            else:
                response = client.post(
                    f"{SUPABASE_URL}/rest/v1/profiles",
                    headers=HEADERS,
                    json=[data],
                )

            if response.status_code >= 400:
                print(f"[Supabase] Profile upsert error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Supabase] Error upserting profile: {e}")


def store_simulation(
    user_id: Optional[str],
    ip_address: str,
    profile: str,
    decision: str,
    synthesis: Dict[str, Any],
    nodes: list,
    edges: list,
    timeline: list,
    reality: Optional[Dict[str, Any]] = None,
) -> str:
    """Store simulation data to Supabase and return share_id."""
    
    share_id = f"sim_{datetime.utcnow().timestamp()}"[-12:]  # Create unique ID
    
    try:
        data = {
            "share_id": share_id,
            "user_id": user_id,
            "ip_address": ip_address,
            "profile": profile,
            "decision": decision,
            "synthesis": json.dumps(synthesis),
            "nodes": json.dumps(nodes),
            "edges": json.dumps(edges),
            "timeline": json.dumps(timeline),
            "reality": json.dumps(reality) if reality else None,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        result = _make_request("POST", "simulations", json=[data])
        return share_id
    except Exception as e:
        print(f"[Supabase] Error storing simulation: {e}")
        raise


def store_user_input(user_id: Optional[str], ip_address: str, form_data: Dict[str, Any]) -> None:
    """Store user form inputs to Supabase."""
    try:
        data = {
            "user_id": user_id,
            "ip_address": ip_address,
            "form_data": json.dumps(form_data),
            "created_at": datetime.utcnow().isoformat(),
        }
        _make_request("POST", "user_inputs", json=[data])
    except Exception as e:
        print(f"[Supabase] Error storing user input: {e}")


def get_simulation(share_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve simulation data by share_id."""
    try:
        with httpx.Client() as client:
            url = f"{SUPABASE_URL}/rest/v1/simulations?share_id=eq.{share_id}"
            response = client.get(url, headers=HEADERS)
            
            if response.status_code == 200 and response.text:
                data_list = response.json()
                if data_list:
                    data = data_list[0]
                    return {
                        "profile": data.get("profile"),
                        "decision": data.get("decision"),
                        "synthesis": json.loads(data.get("synthesis", "{}")),
                        "nodes": json.loads(data.get("nodes", "[]")),
                        "edges": json.loads(data.get("edges", "[]")),
                        "timeline": json.loads(data.get("timeline", "[]")),
                        "reality": json.loads(data.get("reality", "null")),
                    }
        return None
    except Exception as e:
        print(f"[Supabase] Error retrieving simulation: {e}")
        return None


def get_user_history(user_id: str, limit: int = 20) -> list[Dict[str, Any]]:
    """Return recent simulations for a user."""
    try:
        with httpx.Client() as client:
            url = (
                f"{SUPABASE_URL}/rest/v1/simulations"
                f"?user_id=eq.{user_id}"
                "&select=share_id,decision,profile,created_at"
                "&order=created_at.desc"
                f"&limit={limit}"
            )
            response = client.get(url, headers=HEADERS)
            if response.status_code >= 400:
                print(f"[Supabase] Error getting history {response.status_code}: {response.text}")
                return []

            data = response.json() if response.text else []
            return data or []
    except Exception as e:
        print(f"[Supabase] Error getting history: {e}")
        return []


def get_anonymous_history(limit: int = 50) -> list[Dict[str, Any]]:
    """Return recent simulations created by logged-out users."""
    try:
        safe_limit = max(1, min(limit, 100))
        with httpx.Client() as client:
            url = (
                f"{SUPABASE_URL}/rest/v1/simulations"
                "?user_id=is.null"
                "&select=share_id,decision,profile,created_at,ip_address"
                "&order=created_at.desc"
                f"&limit={safe_limit}"
            )
            response = client.get(url, headers=HEADERS)
            if response.status_code >= 400:
                print(f"[Supabase] Error getting anonymous history {response.status_code}: {response.text}")
                return []

            data = response.json() if response.text else []
            return data or []
    except Exception as e:
        print(f"[Supabase] Error getting anonymous history: {e}")
        return []


def get_all_users(limit: int = 100) -> list[Dict[str, Any]]:
    """Return profiles for all known users."""
    try:
        safe_limit = max(1, min(limit, 200))
        with httpx.Client() as client:
            url = (
                f"{SUPABASE_URL}/rest/v1/profiles"
                "?select=user_id,email,auth_provider,last_login_at,created_at,updated_at"
                "&order=updated_at.desc"
                f"&limit={safe_limit}"
            )
            response = client.get(url, headers=HEADERS)
            if response.status_code >= 400:
                print(f"[Supabase] Error getting users {response.status_code}: {response.text}")
                return []

            data = response.json() if response.text else []
            anonymous_history = get_anonymous_history(1)
            anonymous_latest = anonymous_history[0] if anonymous_history else None

            if anonymous_history:
                data.append(
                    {
                        "user_id": "__anonymous__",
                        "email": "Logged out users",
                        "auth_provider": "anonymous",
                        "last_login_at": anonymous_latest.get("created_at"),
                        "created_at": None,
                        "updated_at": anonymous_latest.get("created_at"),
                        "simulation_count": len(get_anonymous_history(100)),
                    }
                )

            return data or []
    except Exception as e:
        print(f"[Supabase] Error getting users: {e}")
        return []


def check_rate_limit(user_id: Optional[str], ip_address: str, email: Optional[str] = None) -> tuple[bool, int, bool]:
    """
    Check if user can run another simulation.
    Returns (allowed: bool, wait_seconds: int, can_login_to_reset: bool)
    """
    try:
        now = datetime.utcnow()

        if is_admin_email(email):
            return True, 0, False

        def extract_timestamp(record: Dict[str, Any]) -> Optional[datetime]:
            for field in ("created_at", "last_attempt", "reset_at"):
                value = record.get(field)
                if value:
                    try:
                        return datetime.fromisoformat(value.replace("Z", "+00:00"))
                    except Exception:
                        continue
            return None
        
        with httpx.Client() as client:
            records = []

            if user_id:
                user_url = f"{SUPABASE_URL}/rest/v1/rate_limits?user_id=eq.{user_id}&select=*&limit=20"
                user_response = client.get(user_url, headers=HEADERS)
                if user_response.status_code == 200 and user_response.text:
                    records.extend(user_response.json() or [])

            ip_url = f"{SUPABASE_URL}/rest/v1/rate_limits?ip_address=eq.{ip_address}&select=*&limit=20"

            ip_response = client.get(ip_url, headers=HEADERS)
            if ip_response.status_code == 200 and ip_response.text:
                records.extend(ip_response.json() or [])

            if not records:
                return True, 0, False  # First time

            timestamps = [extract_timestamp(record) for record in records]
            timestamps = [ts for ts in timestamps if ts is not None]
            if not timestamps:
                return True, 0, False

            last_time = max(timestamps)
            elapsed = (now - last_time).total_seconds()

            if elapsed < RATE_LIMIT_SECONDS:
                wait_time = int(RATE_LIMIT_SECONDS - elapsed)
                can_login = not user_id  # Can't login if already logged in
                return False, wait_time, can_login

            return True, 0, False
        
        return True, 0, False
    except Exception as e:
        print(f"[Supabase] Error checking rate limit: {e}")
        return True, 0, False


def is_admin_email(email: Optional[str]) -> bool:
    if not email:
        return False
    return email.strip().lower() in ADMIN_EMAILS


def record_rate_limit(user_id: Optional[str], ip_address: str) -> None:
    """Record a simulation attempt for rate limiting."""
    try:
        now = datetime.utcnow().isoformat()
        candidates = [
            {
                "user_id": user_id,
                "ip_address": ip_address,
                "created_at": now,
            },
            {
                "user_id": user_id,
                "ip_address": ip_address,
                "last_attempt": now,
                "reset_at": now,
            },
            {
                "user_id": user_id,
                "ip_address": ip_address,
            },
        ]

        for payload in candidates:
            result = _make_request("POST", "rate_limits", json=[payload])
            if result is not None:
                return
    except Exception as e:
        print(f"[Supabase] Error recording rate limit: {e}")


def grant_login_bonus(user_id: str) -> int:
    """Grant free simulations on login. Returns number of free sims."""
    try:
        data = {
            "user_id": user_id,
            "bonus_count": FREE_LOGIN_BONUS,
            "granted_at": datetime.utcnow().isoformat(),
        }
        _make_request("POST", "login_bonuses", json=[data])
        return FREE_LOGIN_BONUS
    except Exception as e:
        print(f"[Supabase] Error granting login bonus: {e}")
        return 0


def check_login_bonus(user_id: str) -> int:
    """Check remaining free simulations from login bonus."""
    try:
        with httpx.Client() as client:
            url = (
                f"{SUPABASE_URL}/rest/v1/login_bonuses"
                f"?user_id=eq.{user_id}"
                "&select=id,bonus_count,used_count,free_sims"
                "&order=created_at.desc"
                "&limit=1"
            )
            response = client.get(url, headers=HEADERS)
            
            if response.status_code == 200 and response.text:
                data_list = response.json()
                if data_list:
                    row = data_list[0]
                    # New schema: bonus_count + used_count
                    if row.get("bonus_count") is not None:
                        bonus = row.get("bonus_count", 0) or 0
                        used = row.get("used_count", 0) or 0
                        return max(0, bonus - used)
                    # Legacy schema: free_sims counter
                    if row.get("free_sims") is not None:
                        return max(0, int(row.get("free_sims", 0) or 0))
            return 0
    except Exception as e:
        print(f"[Supabase] Error checking login bonus: {e}")
        return 0


def use_login_bonus(user_id: str) -> bool:
    """Use one free simulation from login bonus. Returns True if successful."""
    try:
        with httpx.Client() as client:
            url = (
                f"{SUPABASE_URL}/rest/v1/login_bonuses"
                f"?user_id=eq.{user_id}"
                "&select=id,bonus_count,used_count,free_sims"
                "&order=created_at.desc"
                "&limit=1"
            )
            response = client.get(url, headers=HEADERS)

            if response.status_code != 200 or not response.text:
                return False

            data_list = response.json()
            if not data_list:
                return False

            row = data_list[0]
            bonus_id = row.get("id")
            if not bonus_id:
                return False

            # New schema path
            if row.get("bonus_count") is not None:
                bonus = row.get("bonus_count", 0) or 0
                used = row.get("used_count", 0) or 0
                if bonus - used <= 0:
                    return False
                update_data = {"used_count": used + 1}
                _make_request("PATCH", f"login_bonuses?id=eq.{bonus_id}", json=update_data)
                return True

            # Legacy schema path
            if row.get("free_sims") is not None:
                free_sims = int(row.get("free_sims", 0) or 0)
                if free_sims <= 0:
                    return False
                update_data = {"free_sims": free_sims - 1}
                _make_request("PATCH", f"login_bonuses?id=eq.{bonus_id}", json=update_data)
                return True

        return False
    except Exception as e:
        print(f"[Supabase] Error using login bonus: {e}")
        return False

