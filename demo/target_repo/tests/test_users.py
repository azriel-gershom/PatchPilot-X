import pytest
from app.main import app
from app.service import reset_db
from fastapi.testclient import TestClient

client = TestClient(app)


@pytest.fixture(autouse=True)
def run_before_and_after_tests():
    reset_db()
    yield


def test_create_user():
    response = client.post("/users", json={"username": "Alice"})
    assert response.status_code == 201
    assert response.json() == {"id": 1, "username": "Alice"}


def test_list_users():
    client.post("/users", json={"username": "Alice"})
    client.post("/users", json={"username": "Bob"})

    response = client.get("/users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 2
    assert users[0]["username"] == "Alice"
    assert users[1]["username"] == "Bob"


def test_get_user_by_id():
    client.post("/users", json={"username": "Alice"})

    response = client.get("/users/1")
    assert response.status_code == 200
    assert response.json() == {"id": 1, "username": "Alice"}


def test_missing_user():
    response = client.get("/users/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"
