from fastapi import FastAPI
from app.api.routes import repositories, agent

app = FastAPI(title="PatchPilot X", description="AI Software Engineering Agent")

app.include_router(repositories.router, prefix="/api/repositories", tags=["repositories"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "PatchPilot X"
    }
