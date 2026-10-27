"""Tests for the in-memory /api/tasks endpoints."""


def _create(client, **overrides):
    payload = {"title": "Review stock", "priority": "high", "dueDate": "2025-11-01", **overrides}
    return client.post("/api/tasks", json=payload)


def test_get_tasks_returns_list(client):
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_task(client):
    response = _create(client)
    assert response.status_code == 200
    task = response.json()
    assert task["title"] == "Review stock"
    assert task["status"] == "pending"
    assert task["id"] >= 1000
    assert task in client.get("/api/tasks").json()


def test_toggle_task(client):
    task_id = _create(client).json()["id"]
    assert client.patch(f"/api/tasks/{task_id}").json()["status"] == "completed"
    assert client.patch(f"/api/tasks/{task_id}").json()["status"] == "pending"


def test_delete_task(client):
    task_id = _create(client).json()["id"]
    assert client.delete(f"/api/tasks/{task_id}").status_code == 200
    assert all(t["id"] != task_id for t in client.get("/api/tasks").json())


def test_missing_task_returns_404(client):
    assert client.patch("/api/tasks/999999").status_code == 404
    assert client.delete("/api/tasks/999999").status_code == 404


def test_create_requires_title_and_due_date(client):
    assert client.post("/api/tasks", json={"priority": "low"}).status_code == 422
