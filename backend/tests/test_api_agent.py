import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

@patch("app.api.routes.agent.GeminiProvider")
@patch("app.api.routes.agent.MasterOrchestrator")
def test_run_agent(mock_orchestrator, mock_provider):
    response = client.post("/api/agent/run", json={"github_url": "http://github.com/a/b", "task": "do stuff"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "PENDING"
    assert "run_id" in data

@patch("app.api.routes.agent.load_artifact")
def test_get_run_status_mocked(mock_load):
    mock_load.return_value = {"status": "COMPLETED"}
    response = client.get("/api/agent/runs/fake_id")
    assert response.status_code == 200
    assert response.json()["status"]["status"] == "COMPLETED"

def test_get_patch_not_found():
    response = client.get("/api/agent/runs/nonexistent/patch")
    assert response.status_code == 404
