import datetime
import os
import uuid

from app.agent.orchestrator import MasterOrchestrator
from app.core.storage import BASE_DIR, create_run, load_artifact
from app.llm.gemini import GeminiProvider
from app.models.domain import RunStatus
from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

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
        updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
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

    background_tasks.add_task(
        run_orchestrator_task, run_id, request.github_url, request.task
    )

    return AgentRunResponse(
        run_id=run_id,
        status="PENDING",
        repository_url=request.github_url,
        created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )


@router.get("/runs/{run_id}")
async def get_run_status(run_id: str):
    status_data = load_artifact(run_id, "run_status")
    if not status_data:
        raise HTTPException(status_code=404, detail="Run not found")

    return {
        "status": status_data,
        "framework": load_artifact(run_id, "framework"),
        "validation": load_artifact(run_id, "validation"),
    }


@router.get("/runs/{run_id}/patch", response_class=PlainTextResponse)
async def get_run_patch(run_id: str):
    run_dir = os.path.join(BASE_DIR, run_id)
    patch_path = os.path.join(run_dir, "patch.diff")
    if not os.path.exists(patch_path):
        raise HTTPException(status_code=404, detail="Patch not found")

    with open(patch_path, "r", encoding="utf-8") as f:
        return f.read()


@router.get("/runs/{run_id}/events")
async def get_run_events(run_id: str):
    run_dir = os.path.join(BASE_DIR, run_id)
    if not os.path.exists(run_dir):
        raise HTTPException(status_code=404, detail="Run not found")

    events = []

    # We use file existence and timestamps as actual events
    files = os.listdir(run_dir)

    # Helper to add event if file exists
    def add_event(filename, event_type, name, data_key=None):
        if filename in files:
            path = os.path.join(run_dir, filename)
            timestamp = os.path.getmtime(path)
            dt = datetime.datetime.fromtimestamp(
                timestamp, tz=datetime.timezone.utc
            ).isoformat()

            data = None
            if data_key and filename.endswith(".json"):
                from app.core.storage import load_artifact

                data = load_artifact(run_id, filename.replace(".json", ""))

            events.append(
                {"type": event_type, "name": name, "timestamp": dt, "data": data}
            )

    # Map artifacts to events
    add_event("run_status.json", "STATUS", "Run Status", True)
    add_event("framework.json", "ANALYSIS", "Framework detected", True)
    add_event("repo_map.json", "MAPPING", "Repository mapped", True)
    add_event("contract.json", "PLANNING", "Change Contract created", True)
    add_event(
        "post_test_summary_attempt_0.json", "TESTING", "Targeted tests complete", True
    )
    add_event(
        "hallucination_attempt_0.json",
        "VALIDATION",
        "Hallucination check complete",
        True,
    )
    add_event(
        "validation_attempt_0.json", "VALIDATION", "Evidence Gate evaluated", True
    )
    add_event("patch.diff", "PATCH", "Patch generated")

    # Sort events by timestamp
    events.sort(key=lambda x: x["timestamp"])

@router.get("/runs/{run_id}/evidence")
async def get_run_evidence(run_id: str):
    from app.core.storage import load_artifact
    
    baseline = load_artifact(run_id, "baseline")
    
    # We find the latest post_test_summary and validation
    post_test = None
    validation = None
    hallucination = None
    
    for i in range(5):
        pt = load_artifact(run_id, f"post_test_summary_attempt_{i}")
        if pt:
            post_test = pt
        val = load_artifact(run_id, f"validation_attempt_{i}")
        if val:
            validation = val
        hal = load_artifact(run_id, f"hallucination_attempt_{i}")
        if hal:
            hallucination = hal
            
    # Also load the final validation if available
    final_val = load_artifact(run_id, "validation")
    if final_val:
        validation = final_val

    return {
        "baseline": baseline,
        "targeted": post_test,  # We treat post test as targeted + regression
        "regression": post_test,
        "validation": validation,
        "hallucination": hallucination
    }
