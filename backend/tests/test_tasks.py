from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from httpx import AsyncClient


async def create_sample_task(client: AsyncClient, **overrides) -> dict:
    payload = {"title": "Müll rausbringen", "recurrence": "none"} | overrides
    resp = await client.post("/api/tasks", json=payload)
    assert resp.status_code == 201
    return resp.json()


class TestHealth:
    async def test_health_returns_ok(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestListTasks:
    async def test_empty_list(self, client: AsyncClient):
        resp = await client.get("/api/tasks")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_filter_by_completed_false(self, client: AsyncClient):
        await create_sample_task(client, title="Offen")
        await create_sample_task(client, title="Erledigt", completed=True)

        resp = await client.get("/api/tasks?completed=false")
        assert resp.status_code == 200
        titles = [t["title"] for t in resp.json()]
        assert "Offen" in titles
        assert "Erledigt" not in titles

    async def test_filter_by_completed_true(self, client: AsyncClient):
        await create_sample_task(client, title="Offen")
        await create_sample_task(client, title="Erledigt", completed=True)

        resp = await client.get("/api/tasks?completed=true")
        assert resp.status_code == 200
        titles = [t["title"] for t in resp.json()]
        assert "Erledigt" in titles
        assert "Offen" not in titles


class TestCreateTask:
    async def test_create_minimal(self, client: AsyncClient):
        resp = await client.post("/api/tasks", json={"title": "Einkaufen"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Einkaufen"
        assert data["completed"] is False
        assert data["recurrence"] == "none"
        assert "id" in data
        assert "created_at" in data

    async def test_create_full(self, client: AsyncClient):
        payload = {
            "title": "Sport",
            "due_date": "2025-07-01",
            "assignee_initials": "A",
            "assignee_color": "#5B6AF0",
            "recurrence": "weekly",
            "completed": False,
        }
        resp = await client.post("/api/tasks", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["due_date"] == "2025-07-01"
        assert data["recurrence"] == "weekly"

    async def test_create_empty_title_rejected(self, client: AsyncClient):
        resp = await client.post("/api/tasks", json={"title": ""})
        assert resp.status_code == 422

    async def test_create_invalid_recurrence_rejected(self, client: AsyncClient):
        resp = await client.post("/api/tasks", json={"title": "Test", "recurrence": "hourly"})
        assert resp.status_code == 422


class TestGetTask:
    async def test_get_existing(self, client: AsyncClient):
        task = await create_sample_task(client)
        resp = await client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == task["id"]

    async def test_get_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.get("/api/tasks/nonexistent-id")
        assert resp.status_code == 404


class TestUpdateTask:
    async def test_update_title(self, client: AsyncClient):
        task = await create_sample_task(client, title="Alt")
        resp = await client.put(f"/api/tasks/{task['id']}", json={"title": "Neu"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Neu"

    async def test_mark_completed(self, client: AsyncClient):
        task = await create_sample_task(client)
        resp = await client.put(f"/api/tasks/{task['id']}", json={"completed": True})
        assert resp.status_code == 200
        data = resp.json()
        assert data["completed"] is True
        assert data["completed_at"] is not None

    async def test_uncomplete_task_clears_completed_at(self, client: AsyncClient):
        task = await create_sample_task(client)
        await client.put(f"/api/tasks/{task['id']}", json={"completed": True})
        resp = await client.put(f"/api/tasks/{task['id']}", json={"completed": False})
        assert resp.status_code == 200
        data = resp.json()
        assert data["completed"] is False
        assert data["completed_at"] is None

    async def test_update_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.put("/api/tasks/nonexistent-id", json={"title": "X"})
        assert resp.status_code == 404


class TestCleanupTasks:
    async def test_expired_task_deleted_on_list(self, client: AsyncClient):
        task = await create_sample_task(client)
        await client.put(f"/api/tasks/{task['id']}", json={"completed": True})

        future = datetime.now(timezone.utc) + timedelta(hours=7)
        with patch("app.routers.tasks.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/tasks")

        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()]
        assert task["id"] not in ids

    async def test_recent_completed_task_still_visible(self, client: AsyncClient):
        task = await create_sample_task(client)
        await client.put(f"/api/tasks/{task['id']}", json={"completed": True})

        future = datetime.now(timezone.utc) + timedelta(hours=5)
        with patch("app.routers.tasks.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/tasks")

        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()]
        assert task["id"] in ids

    async def test_open_task_never_deleted(self, client: AsyncClient):
        task = await create_sample_task(client)

        future = datetime.now(timezone.utc) + timedelta(hours=100)
        with patch("app.routers.tasks.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/tasks")

        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()]
        assert task["id"] in ids

    async def test_task_without_completed_at_not_deleted(self, client: AsyncClient):
        # Tasks completed before this feature (completed_at=NULL) must not be deleted
        task = await create_sample_task(client, completed=True)

        future = datetime.now(timezone.utc) + timedelta(hours=100)
        with patch("app.routers.tasks.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/tasks")

        assert resp.status_code == 200
        ids = [t["id"] for t in resp.json()]
        assert task["id"] in ids


class TestDeleteTask:
    async def test_delete_existing(self, client: AsyncClient):
        task = await create_sample_task(client)
        resp = await client.delete(f"/api/tasks/{task['id']}")
        assert resp.status_code == 204

        get_resp = await client.get(f"/api/tasks/{task['id']}")
        assert get_resp.status_code == 404

    async def test_delete_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.delete("/api/tasks/nonexistent-id")
        assert resp.status_code == 404
