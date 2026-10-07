import os
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from app.agent.orchestrator import MasterOrchestrator
from app.llm.gemini import GeminiProvider
from app.core.storage import BASE_DIR, load_artifact, create_run
import uuid
import datetime
from app.models.domain import RunStatus

router = APIRouter()

class AgentRunRequest(BaseModel):
    github_url: str
    task: str

class AgentRunResponse(BaseModel):
    run_id: str
    status: str
    repository_url: str
    created_at: str
    updated_at: str

def update_run_status(run_id: str, status: str, repository_url: str):
    run_status = AgentRunResponse(
        run_id=run_id,
        status=status,
        repository_url=repository_url,
        created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    from app.core.storage import save_artifact
    save_artifact(run_id, "run_status", run_status)

async def run_orchestrator_task(run_id: str, github_url: str, task: str):
    try:
        update_run_status(run_id, "RUNNING", github_url)
        llm = GeminiProvider()
        orchestrator = MasterOrchestrator(llm)
        result = await orchestrator.run(run_id, github_url, task)
        update_run_status(run_id, result["status"], github_url)
    except Exception as e:
        update_run_status(run_id, "FAILED", github_url)

@router.post("/run", response_model=AgentRunResponse)
async def run_agent(request: AgentRunRequest, background_tasks: BackgroundTasks):
    run_id = create_run()
    
    update_run_status(run_id, "PENDING", request.github_url)
    
    background_tasks.add_task(run_orchestrator_task, run_id, request.github_url, request.task)
    
    return AgentRunResponse(
        run_id=run_id,
        status="PENDING",
        repository_url=request.github_url,
        created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )

@router.get("/runs/{run_id}")
async def get_run_status(run_id: str):
    status_data = load_artifact(run_id, "run_status")
    if not status_data:
        raise HTTPException(status_code=404, detail="Run not found")
        
    return {
        "status": status_data,
        "framework": load_artifact(run_id, "framework"),
        "validation": load_artifact(run_id, "validation")
    }

@router.get("/runs/{run_id}/patch", response_class=PlainTextResponse)
async def get_run_patch(run_id: str):
    run_dir = os.path.join(BASE_DIR, run_id)
    patch_path = os.path.join(run_dir, "patch.diff")
    if not os.path.exists(patch_path):
        raise HTTPException(status_code=404, detail="Patch not found")
        
    with open(patch_path, "r", encoding="utf-8") as f:
        return f.read()
