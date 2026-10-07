from fastapi import FastAPI
from app.api.routes import repositories

app = FastAPI(title="PatchPilot X", description="AI Software Engineering Agent")

app.include_router(repositories.router, prefix="/api/repositories", tags=["repositories"])

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "PatchPilot X"
    }
