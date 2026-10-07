import os
import pytest
from unittest.mock import patch, MagicMock
from app.services.repo_manager import RepoManager
import subprocess

def test_validate_url():
    manager = RepoManager()
    assert manager.validate_url("https://github.com/user/repo.git") is True
    assert manager.validate_url("https://example.com/repo.git") is False
    assert manager.validate_url("file:///etc/passwd") is False

@patch("subprocess.run")
def test_clone_success(mock_run, tmp_path):
    manager = RepoManager(base_workspace_dir=str(tmp_path))
    
    def side_effect(args, **kwargs):
        if args[1] == "clone":
            os.makedirs(args[3], exist_ok=True)
            return MagicMock(returncode=0)
        elif args[1] == "branch":
            return MagicMock(returncode=0, stdout="main\n")
        elif args[1] == "rev-parse":
            return MagicMock(returncode=0, stdout="abcdef123\n")
            
    mock_run.side_effect = side_effect
    
    repo = manager.clone_repository("https://github.com/a/b.git", "run123")
    assert repo.url == "https://github.com/a/b.git"
    assert repo.branch == "main"
    assert repo.commit_sha == "abcdef123"
    assert os.path.exists(repo.workspace_path)
    
    manager.cleanup_repository("run123")
    assert not os.path.exists(repo.workspace_path)

def test_clone_failure():
    manager = RepoManager()
    with pytest.raises(RuntimeError):
        # We test real subprocess failure here
        manager.clone_repository("https://github.com/azriel-gershom/this-repo-does-not-exist.git", "fail_run")
