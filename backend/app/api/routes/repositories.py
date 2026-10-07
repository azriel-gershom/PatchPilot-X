from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.repo_manager import RepoManager
from app.models.domain import RepositoryInfo
import uuid

router = APIRouter()
repo_manager = RepoManager()

class InspectRequest(BaseModel):
    repository_url: str

@router.post("/inspect", response_model=RepositoryInfo)
def inspect_repository(req: InspectRequest):
    run_id = str(uuid.uuid4())
    try:
        repo_info = repo_manager.clone_repository(req.repository_url, run_id)
        return repo_info
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
