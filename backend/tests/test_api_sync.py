import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

@patch("app.api.routes.sync.RepoManager")
@patch("app.api.routes.sync.FrameworkDetector")
@patch("app.api.routes.sync.RepoAnalyzer")
def test_sync_repository(mock_analyzer, mock_detector, mock_repo):
    mock_repo_instance = MagicMock()
    mock_repo_instance.clone.return_value = "/tmp/workspace"
    mock_repo.return_value = mock_repo_instance
    
    response = client.post("/api/sync", json={"github_url": "http://github.com/a/b"})
    assert response.status_code == 202
    assert response.json()["message"] == "Sync started"
