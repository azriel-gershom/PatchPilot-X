from app.api.routes import agent, repositories, sync
from fastapi import FastAPI

app = FastAPI(title="PatchPilot X", description="AI Software Engineering Agent")

app.include_router(
    repositories.router, prefix="/api/repositories", tags=["repositories"]
)
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(sync.router, prefix="/api/sync", tags=["sync"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "PatchPilot X"}
