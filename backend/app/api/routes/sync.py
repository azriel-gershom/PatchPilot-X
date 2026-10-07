import os
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.repo_manager import RepoManager
from app.services.framework_detector import FrameworkDetector
from app.services.repo_analyzer import RepoAnalyzer

router = APIRouter()

class SyncRequest(BaseModel):
    github_url: str

def sync_repository_task(github_url: str):
    repo_manager = RepoManager()
    detector = FrameworkDetector()
    analyzer = RepoAnalyzer()
    
    try:
        workspace_path = repo_manager.clone(github_url)
        framework = detector.detect(workspace_path)
        index = analyzer.build_map(workspace_path)
        print(f"Synced {github_url}: {framework.language}")
    except Exception as e:
        print(f"Error syncing {github_url}: {e}")

@router.post("", status_code=202)
async def sync_repository(request: SyncRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(sync_repository_task, request.github_url)
    return {"status": "Accepted", "message": "Sync started"}
