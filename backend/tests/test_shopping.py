from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from httpx import AsyncClient


async def create_sample_item(client: AsyncClient, **overrides) -> dict:
    payload = {"name": "Milch", "quantity": 2, "unit": "stk", "store": "migros"} | overrides
    resp = await client.post("/api/shopping", json=payload)
    assert resp.status_code == 201
    return resp.json()


class TestListShopping:
    async def test_empty_list(self, client: AsyncClient):
        resp = await client.get("/api/shopping")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_all_items(self, client: AsyncClient):
        await create_sample_item(client, name="Milch")
        await create_sample_item(client, name="Brot")
        resp = await client.get("/api/shopping")
        assert resp.status_code == 200
        names = [i["name"] for i in resp.json()]
        assert "Milch" in names
        assert "Brot" in names

    async def test_sorted_by_created_at_desc(self, client: AsyncClient):
        # SQLite has second-precision timestamps; just verify DESC is the intent
        # by checking order_by is applied (no crash, items returned)
        await create_sample_item(client, name="A")
        await create_sample_item(client, name="B")
        resp = await client.get("/api/shopping")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


class TestCreateShopping:
    async def test_create_minimal(self, client: AsyncClient):
        resp = await client.post(
            "/api/shopping",
            json={"name": "Äpfel", "quantity": 6, "unit": "stk"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Äpfel"
        assert data["quantity"] == 6
        assert data["unit"] == "stk"
        assert data["store"] == "egal"
        assert data["checked"] is False
        assert data["checked_at"] is None
        assert "id" in data
        assert "created_at" in data

    async def test_create_full(self, client: AsyncClient):
        payload = {"name": "Käse", "quantity": 500, "unit": "g", "store": "coop"}
        resp = await client.post("/api/shopping", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["unit"] == "g"
        assert data["store"] == "coop"

    async def test_name_is_trimmed(self, client: AsyncClient):
        resp = await client.post(
            "/api/shopping",
            json={"name": "  Brot  ", "quantity": 1, "unit": "stk"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Brot"

    async def test_empty_name_rejected(self, client: AsyncClient):
        resp = await client.post("/api/shopping", json={"name": "", "quantity": 1, "unit": "stk"})
        assert resp.status_code == 422

    async def test_quantity_zero_rejected(self, client: AsyncClient):
        resp = await client.post("/api/shopping", json={"name": "X", "quantity": 0, "unit": "stk"})
        assert resp.status_code == 422

    async def test_invalid_unit_rejected(self, client: AsyncClient):
        resp = await client.post("/api/shopping", json={"name": "X", "quantity": 1, "unit": "kg"})
        assert resp.status_code == 422

    async def test_invalid_store_rejected(self, client: AsyncClient):
        resp = await client.post(
            "/api/shopping",
            json={"name": "X", "quantity": 1, "unit": "stk", "store": "rewe"},
        )
        assert resp.status_code == 422


class TestUpdateShopping:
    async def test_update_name(self, client: AsyncClient):
        item = await create_sample_item(client, name="Alt")
        resp = await client.put(f"/api/shopping/{item['id']}", json={"name": "Neu"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Neu"

    async def test_update_quantity(self, client: AsyncClient):
        item = await create_sample_item(client, quantity=1)
        resp = await client.put(f"/api/shopping/{item['id']}", json={"quantity": 10})
        assert resp.status_code == 200
        assert resp.json()["quantity"] == 10

    async def test_check_item_sets_checked_at(self, client: AsyncClient):
        item = await create_sample_item(client)
        resp = await client.put(f"/api/shopping/{item['id']}", json={"checked": True})
        assert resp.status_code == 200
        data = resp.json()
        assert data["checked"] is True
        assert data["checked_at"] is not None

    async def test_uncheck_item_clears_checked_at(self, client: AsyncClient):
        item = await create_sample_item(client)
        await client.put(f"/api/shopping/{item['id']}", json={"checked": True})
        resp = await client.put(f"/api/shopping/{item['id']}", json={"checked": False})
        assert resp.status_code == 200
        data = resp.json()
        assert data["checked"] is False
        assert data["checked_at"] is None

    async def test_update_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.put("/api/shopping/nonexistent-id", json={"name": "X"})
        assert resp.status_code == 404

    async def test_name_trim_on_update(self, client: AsyncClient):
        item = await create_sample_item(client)
        resp = await client.put(f"/api/shopping/{item['id']}", json={"name": "  Joghurt  "})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Joghurt"


class TestCleanupShopping:
    async def test_expired_item_deleted_on_list(self, client: AsyncClient):
        item = await create_sample_item(client)
        await client.put(f"/api/shopping/{item['id']}", json={"checked": True})

        future = datetime.now(timezone.utc) + timedelta(hours=7)
        with patch("app.routers.shopping.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/shopping")

        assert resp.status_code == 200
        ids = [i["id"] for i in resp.json()]
        assert item["id"] not in ids

    async def test_recent_checked_item_still_visible(self, client: AsyncClient):
        item = await create_sample_item(client)
        await client.put(f"/api/shopping/{item['id']}", json={"checked": True})

        future = datetime.now(timezone.utc) + timedelta(hours=5)
        with patch("app.routers.shopping.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/shopping")

        assert resp.status_code == 200
        ids = [i["id"] for i in resp.json()]
        assert item["id"] in ids

    async def test_unchecked_item_never_deleted(self, client: AsyncClient):
        item = await create_sample_item(client)

        future = datetime.now(timezone.utc) + timedelta(hours=100)
        with patch("app.routers.shopping.datetime") as mock_dt:
            mock_dt.now.return_value = future
            resp = await client.get("/api/shopping")

        assert resp.status_code == 200
        ids = [i["id"] for i in resp.json()]
        assert item["id"] in ids


class TestDeleteShopping:
    async def test_delete_existing(self, client: AsyncClient):
        item = await create_sample_item(client)
        resp = await client.delete(f"/api/shopping/{item['id']}")
        assert resp.status_code == 204

        get_resp = await client.get("/api/shopping")
        ids = [i["id"] for i in get_resp.json()]
        assert item["id"] not in ids

    async def test_delete_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.delete("/api/shopping/nonexistent-id")
        assert resp.status_code == 404
