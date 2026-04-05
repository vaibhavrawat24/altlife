FROM python:3.11-slim

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=user api/ ./api/
COPY --chown=user agents/ ./agents/
COPY --chown=user models/ ./models/
COPY --chown=user services/ ./services/
COPY --chown=user simulation/ ./simulation/

EXPOSE 7860

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
