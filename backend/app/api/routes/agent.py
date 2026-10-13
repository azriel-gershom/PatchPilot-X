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
    error_message: str | None = None


def update_run_status(
    run_id: str,
    status: str,
    repository_url: str,
    error_message: str | None = None,
):
    run_status = AgentRunResponse(
        run_id=run_id,
        status=status,
        repository_url=repository_url,
        created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        error_message=error_message,
    )
    from app.core.storage import save_artifact

    save_artifact(run_id, "run_status", run_status)


from app.llm.fallback import FallbackLLMProvider
from app.llm.groq import GroqProvider

async def run_orchestrator_task(run_id: str, github_url: str, task: str):
    try:
        update_run_status(run_id, "RUNNING", github_url)
        providers = []
        try:
            providers.append(GeminiProvider())
        except Exception:
            pass
        try:
            providers.append(GroqProvider())
        except Exception:
            pass
        if not providers:
            llm = GeminiProvider()
        elif len(providers) == 1:
            llm = providers[0]
        else:
            llm = FallbackLLMProvider(providers)

        orchestrator = MasterOrchestrator(llm)
        result = await orchestrator.run(run_id, github_url, task)
        status = result.get("status", "COMPLETED_SUCCESS") if isinstance(result, dict) else "COMPLETED_SUCCESS"
        update_run_status(run_id, status, github_url)
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_log = os.path.join(BASE_DIR, run_id, "error.log")
        try:
            with open(error_log, "w", encoding="utf-8") as f:
                f.write(traceback.format_exc())
        except Exception:
            pass
        from app.core.storage import save_artifact
        save_artifact(run_id, "error", {"message": error_msg, "traceback": traceback.format_exc()})
        update_run_status(run_id, "FAILED", github_url, error_message=error_msg)


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


@router.get("/runs")
async def list_runs():
    if not os.path.exists(BASE_DIR):
        return {"runs": []}

    runs = []
    try:
        entries = list(os.scandir(BASE_DIR))
    except Exception:
        return {"runs": []}

    for entry in entries:
        if not entry.is_dir():
            continue
        run_id = entry.name
        run_dir = entry.path

        status_data = load_artifact(run_id, "run_status")
        clone_data = load_artifact(run_id, "clone")
        contract_data = load_artifact(run_id, "contract")
        validation_data = load_artifact(run_id, "validation")
        has_patch = os.path.exists(os.path.join(run_dir, "patch.diff"))

        # Determine status
        status = "PENDING"
        if status_data and isinstance(status_data, dict) and "status" in status_data:
            status = status_data["status"]
        elif os.path.exists(os.path.join(run_dir, "error.log")):
            status = "FAILED"
        elif validation_data and isinstance(validation_data, dict):
            status = "COMPLETED_SUCCESS" if validation_data.get("passed") else "COMPLETED_FAILED_VALIDATION"
        elif has_patch:
            status = "COMPLETED_SUCCESS"

        repo_url = ""
        if status_data and isinstance(status_data, dict) and "repository_url" in status_data:
            repo_url = status_data["repository_url"]
        elif clone_data and isinstance(clone_data, dict) and "url" in clone_data:
            repo_url = clone_data["url"]

        task = ""
        if contract_data and isinstance(contract_data, dict) and "goal" in contract_data:
            task = contract_data["goal"]

        try:
            mtime = entry.stat().st_mtime
        except Exception:
            mtime = 0

        created_at = (
            status_data.get("created_at")
            if (status_data and isinstance(status_data, dict) and "created_at" in status_data)
            else datetime.datetime.fromtimestamp(mtime, tz=datetime.timezone.utc).isoformat()
        )

        runs.append({
            "run_id": run_id,
            "status": status,
            "repository_url": repo_url,
            "task": task,
            "created_at": created_at,
            "has_patch": has_patch,
            "validation_passed": validation_data.get("passed") if isinstance(validation_data, dict) else None,
            "mtime": mtime
        })

    runs.sort(key=lambda r: r["mtime"], reverse=True)
    return {"runs": runs[:50]}


@router.get("/runs/{run_id}")
async def get_run_status(run_id: str):
    status_data = load_artifact(run_id, "run_status")
    run_dir = os.path.join(BASE_DIR, run_id)
    if not status_data and not os.path.exists(run_dir):
        raise HTTPException(status_code=404, detail="Run not found")

    validation = load_artifact(run_id, "validation")
    framework = load_artifact(run_id, "framework")
    contract = load_artifact(run_id, "contract")
    clone = load_artifact(run_id, "clone")
    has_patch = os.path.exists(os.path.join(run_dir, "patch.diff")) if os.path.exists(run_dir) else False

    if not status_data:
        status = "PENDING"
        if os.path.exists(os.path.join(run_dir, "error.log")):
            status = "FAILED"
        elif validation and isinstance(validation, dict):
            status = "COMPLETED_SUCCESS" if validation.get("passed") else "COMPLETED_FAILED_VALIDATION"
        elif has_patch:
            status = "COMPLETED_SUCCESS"

        repo_url = clone.get("url", "") if (clone and isinstance(clone, dict)) else ""
        mtime = os.path.getmtime(run_dir) if os.path.exists(run_dir) else 0
        ts = datetime.datetime.fromtimestamp(mtime, tz=datetime.timezone.utc).isoformat()
        status_data = {
            "run_id": run_id,
            "status": status,
            "repository_url": repo_url,
            "created_at": ts,
            "updated_at": ts,
        }

    repo_map = load_artifact(run_id, "repo_map")
    explanation = None
    if os.path.exists(run_dir):
        exp_path = os.path.join(run_dir, "explanation.md")
        if os.path.exists(exp_path):
            try:
                with open(exp_path, "r", encoding="utf-8") as f:
                    explanation = f.read()
            except Exception:
                pass

    error_message = None
    if isinstance(status_data, dict) and status_data.get("error_message"):
        error_message = status_data["error_message"]
    elif os.path.exists(run_dir):
        error_log = os.path.join(run_dir, "error.log")
        if os.path.exists(error_log):
            try:
                with open(error_log, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines() if l.strip()]
                    error_message = lines[-1] if lines else "Execution error"
            except Exception:
                pass

    contract_rejection = load_artifact(run_id, "contract_rejection")

    return {
        "status": status_data,
        "framework": framework,
        "validation": validation,
        "contract": contract,
        "contract_rejection": contract_rejection,
        "repo_map": repo_map,
        "explanation": explanation,
        "error": error_message,
        "has_patch": has_patch,
    }


@router.get("/runs/{run_id}/explanation", response_class=PlainTextResponse)
async def get_run_explanation(run_id: str):
    run_dir = os.path.join(BASE_DIR, run_id)
    exp_path = os.path.join(run_dir, "explanation.md")
    if not os.path.exists(exp_path):
        raise HTTPException(status_code=404, detail="Explanation not found")

    with open(exp_path, "r", encoding="utf-8") as f:
        return f.read()


@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str):
    run_dir = os.path.join(BASE_DIR, run_id)
    if not os.path.exists(run_dir):
        raise HTTPException(status_code=404, detail="Run not found")
    status_data = load_artifact(run_id, "run_status")
    repo_url = status_data.get("repository_url", "") if isinstance(status_data, dict) else ""
    update_run_status(run_id, "CANCELLED", repo_url)
    return {"status": "CANCELLED", "run_id": run_id}


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
    add_event("clone.json", "CLONE", "Repository cloned", True)
    add_event("framework.json", "ANALYSIS", "Framework detected", True)
    add_event("repo_map.json", "MAPPING", "Repository mapped", True)
    add_event("contract.json", "PLANNING", "Change Contract created", True)
    add_event("contract_rejection.json", "REJECTION", "Change Contract Rejected", True)
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

    if "error.log" in files:
        err_path = os.path.join(run_dir, "error.log")
        err_time = os.path.getmtime(err_path)
        err_dt = datetime.datetime.fromtimestamp(
            err_time, tz=datetime.timezone.utc
        ).isoformat()
        try:
            with open(err_path, "r", encoding="utf-8") as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]
                err_text = lines[-1] if lines else "Pipeline Execution Error"
        except Exception:
            err_text = "Pipeline Execution Error"
        events.append({"type": "ERROR", "name": "Pipeline Failure", "timestamp": err_dt, "data": err_text})

    # Sort events by timestamp
    events.sort(key=lambda x: x["timestamp"])
    
    return {"events": events}

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
