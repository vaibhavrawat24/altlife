---
title: Altlife
emoji: 🔀
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Altlife

Altlife is a decision simulation engine. You describe a life decision — quitting your job, moving cities, starting a business — and a network of AI agents simulates how it plays out over 12 months.

## What it does

Most decision tools give you one answer. Altlife gives you a world. It spins up a cast of actors relevant to your specific situation — your employer, your bank, your family, the economy — and runs them through 12 months of simulated time, each acting on their own logic.

The output isn't a prediction. It's a stress test: here's who gets affected, here's what they do, here's where things go sideways, here's your risk score.

## How it works

When you submit a decision, the engine runs through several stages in sequence:

**1. Profile extraction**
Your free-text input is structured into a profile — profession, financial runway, risk tolerance, location, support system.

**2. World building**
A world builder agent creates a cast of actors relevant to your decision. For a job resignation, this might be your current employer, a recruiter, your savings account, your landlord, a startup co-founder. Each actor has a role, a stake in your decision, and a disposition.

**3. Agent simulation — 3 rounds**
Each actor runs independently through 3 rounds of interaction. In each round they generate events, react to other actors' moves, and update their stance. Actors can shift from supportive to skeptical as the simulation unfolds.

**4. Reality check**
A separate agent cross-references your scenario against real-world context — market conditions, typical outcomes for similar decisions, base rates.

**5. Synthesis**
A synthesizer reads all actor timelines and produces a final verdict: most likely outcome, key risks, key opportunities, conditions for success, and a 0–100 risk score.

## Agent types

| Agent | Role |
|---|---|
| World Builder | Constructs the actor graph for your specific situation |
| Actor agents | Each simulates one stakeholder across 3 rounds |
| Reality Checker | Grounds the simulation in real-world context |
| Synthesizer | Produces the final analysis and risk score |

## Tech stack

**Backend** — FastAPI (Python), streaming SSE, Supabase (Postgres + Auth), OpenRouter / GitHub Models / OpenAI

**Frontend** — Next.js 15, animated force-directed graph (D3), Framer Motion, Supabase Auth (Google OAuth + email)

**Infrastructure** — Dockerized backend, Vercel frontend, rate limiting per user and IP
