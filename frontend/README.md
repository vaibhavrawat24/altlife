# Altlife — Frontend

Next.js 15 frontend for the Altlife decision simulation engine.

## Structure

```
frontend/
├── app/
│   ├── simulate/        # Main simulation page (graph + timeline + synthesis)
│   ├── auth/
│   │   ├── login/       # Email/password login
│   │   ├── signup/      # Email/password signup
│   │   └── callback/    # OAuth redirect handler
│   └── layout.tsx
├── components/
│   ├── input/
│   │   └── InputForm    # Decision + profile form
│   └── graph/
│       ├── SimulationGraph   # Force-directed actor graph (D3)
│       └── NodePanel         # Actor detail panel
├── hooks/
│   ├── useSimulationStream  # SSE streaming from backend
│   ├── useRateLimit         # Client-side cooldown timer
│   └── useAuth              # Supabase auth state + token management
└── types/
    └── simulation.ts        # Shared TypeScript types
```

## Key flows

**Simulation** — `useSimulationStream` opens an SSE connection to `/simulate/stream`. Events arrive incrementally (`profile_extracted` → `graph_ready` → `actor_complete` × N → `timeline_ready` → `synthesis_complete`) and each updates the UI in real time.

**Rate limiting** — `useRateLimit` stores a cooldown deadline in localStorage. For anonymous users it's set client-side on submit. For authenticated users it's set when the backend returns a 429. The countdown timer and disabled button state are identical for both.

**Auth** — Email/password via backend endpoints + Google OAuth via Supabase. Sessions are managed by the Supabase client (auto-refresh). The active access token is kept in `localStorage` under `altlife_token` and sent as a `Bearer` header on API requests.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `https://your-api.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase anon key |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
