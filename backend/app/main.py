import dotenv
dotenv.load_dotenv()

from app.api.routes import agent, repositories, sync
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PatchPilot X", description="AI Software Engineering Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    repositories.router, prefix="/api/repositories", tags=["repositories"]
)
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(sync.router, prefix="/api/sync", tags=["sync"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "PatchPilot X"}
