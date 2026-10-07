from unittest.mock import patch

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_inspect_invalid_url():
    resp = client.post(
        "/api/repositories/inspect", json={"repository_url": "invalid-url"}
    )
    assert resp.status_code == 400


@patch("app.services.repo_manager.RepoManager.clone_repository")
def test_inspect_valid_url(mock_clone):
    from app.models.domain import RepositoryInfo

    mock_clone.return_value = RepositoryInfo(
        url="https://github.com/a/b.git",
        branch="main",
        commit_sha="123",
        workspace_path="/tmp/test",
    )
    resp = client.post(
        "/api/repositories/inspect",
        json={"repository_url": "https://github.com/a/b.git"},
    )
    assert resp.status_code == 200
    assert resp.json()["branch"] == "main"
