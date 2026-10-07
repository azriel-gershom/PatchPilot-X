import os
import re
import shutil
import subprocess
import tempfile
from typing import Optional

from app.models.domain import RepositoryInfo

# A simple regex for safe GitHub/Gitlab https urls
SAFE_URL_PATTERN = re.compile(
    r"^https://(github\.com|gitlab\.com)/[\w.-]+/[\w.-]+\.git$"
)


class RepoManager:
    def __init__(self, base_workspace_dir: Optional[str] = None):
        if not base_workspace_dir:
            base_workspace_dir = os.path.join(
                tempfile.gettempdir(), "patchpilot_workspaces"
            )
        self.base_workspace_dir = base_workspace_dir
        os.makedirs(self.base_workspace_dir, exist_ok=True)

    def validate_url(self, url: str) -> bool:
        if not url:
            return False
        if (
            ".." in url
            or url.startswith("file://")
            or url.startswith("/")
            or url.startswith("\\")
        ):
            return False
        return bool(SAFE_URL_PATTERN.match(url))

    def clone_repository(self, url: str, run_id: str) -> RepositoryInfo:
        if not self.validate_url(url):
            raise ValueError("Invalid or unsafe repository URL")

        clean_run_id = os.path.basename(run_id)
        workspace_path = os.path.join(self.base_workspace_dir, clean_run_id)

        if os.path.exists(workspace_path):
            raise ValueError("Workspace already exists for this run_id")

        try:
            subprocess.run(
                ["git", "clone", url, workspace_path],
                check=True,
                capture_output=True,
                text=True,
            )

            branch_proc = subprocess.run(
                ["git", "branch", "--show-current"],
                cwd=workspace_path,
                check=True,
                capture_output=True,
                text=True,
            )
            branch = branch_proc.stdout.strip()
            if not branch:
                branch = "HEAD"

            sha_proc = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=workspace_path,
                check=True,
                capture_output=True,
                text=True,
            )
            commit_sha = sha_proc.stdout.strip()

            return RepositoryInfo(
                url=url,
                branch=branch,
                commit_sha=commit_sha,
                workspace_path=workspace_path,
            )
        except subprocess.CalledProcessError as e:
            if os.path.exists(workspace_path):
                shutil.rmtree(workspace_path, ignore_errors=True)
            raise RuntimeError(f"Failed to clone repository: {e.stderr}")

    def cleanup_repository(self, run_id: str):
        clean_run_id = os.path.basename(run_id)
        workspace_path = os.path.join(self.base_workspace_dir, clean_run_id)
        if os.path.exists(workspace_path):
            shutil.rmtree(workspace_path, ignore_errors=True)
