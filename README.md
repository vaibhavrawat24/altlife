---
title: Altlife
emoji: 🔀
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Altlife - Future Simulation Engine

## Overview

Altlife simulates possible outcomes for user decisions using multiple AI agents with distinct perspectives. It is not a prediction system, but a scenario simulation engine.

## Features
- Multiple agent perspectives (Optimist, Pessimist, Risk Analyst, Mentor)
- 3 rounds of agent interaction
- Timeline, summary, and risk score output
- Async, modular FastAPI backend

## Folder Structure
```
altlife/
├── agents/
│   ├── base.py
│   ├── optimist.py
│   ├── pessimist.py
│   ├── risk.py
│   └── mentor.py
├── api/
│   └── main.py
├── services/
│   └── llm.py
├── simulation/
│   └── orchestrator.py
├── requirements.txt
└── .env.example
```

## Setup Instructions

1. **Clone repo & enter folder**

2. **Create virtual environment**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set OpenAI API key**
- Copy `.env.example` to `.env` and add your OpenAI API key.
- Or set `OPENAI_API_KEY` in your environment.

5. **Run the API**
```bash
uvicorn api.main:app --reload
```

6. **Test the endpoint**
```bash
curl -X POST http://localhost:8000/simulate \
  -H 'Content-Type: application/json' \
  -d '{"profile": "Software engineer, 5 years experience, $50k savings", "decision": "Quit job to start a startup"}'
```

## Notes
- Uses OpenAI GPT-4.1 API (set your key!)
- No LangChain or external frameworks
- Async/await throughout
- Modular and ready to extend
