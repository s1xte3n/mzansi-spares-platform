from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "fastapi-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
