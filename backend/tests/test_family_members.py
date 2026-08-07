import pytest
from httpx import AsyncClient


async def create_member(client: AsyncClient, **overrides) -> dict:
    payload = {"name": "Anton", "initials": "A", "color": "#5B6AF0"} | overrides
    resp = await client.post("/api/family-members", json=payload)
    assert resp.status_code == 201
    return resp.json()


class TestListFamilyMembers:
    async def test_empty_list(self, client: AsyncClient):
        resp = await client.get("/api/family-members")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_created_members(self, client: AsyncClient):
        await create_member(client, name="Anton", initials="A")
        await create_member(client, name="Milena", initials="M", color="#F0805B")
        resp = await client.get("/api/family-members")
        assert resp.status_code == 200
        names = [m["name"] for m in resp.json()]
        assert "Anton" in names
        assert "Milena" in names


class TestCreateFamilyMember:
    async def test_create_minimal(self, client: AsyncClient):
        resp = await client.post(
            "/api/family-members",
            json={"name": "Anton", "initials": "A", "color": "#5B6AF0"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Anton"
        assert data["initials"] == "A"
        assert data["color"] == "#5B6AF0"
        assert data["online"] is False
        assert "id" in data
        assert "created_at" in data

    async def test_initials_stored_uppercase(self, client: AsyncClient):
        resp = await client.post(
            "/api/family-members",
            json={"name": "Lena", "initials": "l", "color": "#4CAF82"},
        )
        assert resp.status_code == 201
        assert resp.json()["initials"] == "L"

    async def test_name_is_trimmed(self, client: AsyncClient):
        resp = await client.post(
            "/api/family-members",
            json={"name": "  Anton  ", "initials": "A", "color": "#5B6AF0"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Anton"

    async def test_duplicate_initials_returns_409(self, client: AsyncClient):
        await create_member(client, initials="A")
        resp = await client.post(
            "/api/family-members",
            json={"name": "Anna", "initials": "A", "color": "#F0C75B"},
        )
        assert resp.status_code == 409

    async def test_empty_name_rejected(self, client: AsyncClient):
        resp = await client.post(
            "/api/family-members",
            json={"name": "", "initials": "A", "color": "#5B6AF0"},
        )
        assert resp.status_code == 422

    async def test_initials_too_long_rejected(self, client: AsyncClient):
        resp = await client.post(
            "/api/family-members",
            json={"name": "Anton", "initials": "AKK", "color": "#5B6AF0"},
        )
        assert resp.status_code == 422

    async def test_invalid_color_rejected(self, client: AsyncClient):
        resp = await client.post(
            "/api/family-members",
            json={"name": "Anton", "initials": "A", "color": "blue"},
        )
        assert resp.status_code == 422


class TestUpdateFamilyMember:
    async def test_update_name(self, client: AsyncClient):
        member = await create_member(client)
        resp = await client.put(f"/api/family-members/{member['id']}", json={"name": "Toni"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Toni"

    async def test_update_color(self, client: AsyncClient):
        member = await create_member(client)
        resp = await client.put(
            f"/api/family-members/{member['id']}", json={"color": "#FF0000"}
        )
        assert resp.status_code == 200
        assert resp.json()["color"] == "#FF0000"

    async def test_update_initials_stored_uppercase(self, client: AsyncClient):
        member = await create_member(client, initials="A")
        resp = await client.put(f"/api/family-members/{member['id']}", json={"initials": "ak"})
        assert resp.status_code == 200
        assert resp.json()["initials"] == "AK"

    async def test_update_initials_conflict_returns_409(self, client: AsyncClient):
        await create_member(client, name="Milena", initials="M", color="#F0805B")
        member_a = await create_member(client, name="Anton", initials="A")
        resp = await client.put(f"/api/family-members/{member_a['id']}", json={"initials": "M"})
        assert resp.status_code == 409

    async def test_update_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.put("/api/family-members/nonexistent-id", json={"name": "X"})
        assert resp.status_code == 404


class TestDeleteFamilyMember:
    async def test_delete_existing(self, client: AsyncClient):
        member = await create_member(client)
        resp = await client.delete(f"/api/family-members/{member['id']}")
        assert resp.status_code == 204

        get_resp = await client.get("/api/family-members")
        ids = [m["id"] for m in get_resp.json()]
        assert member["id"] not in ids

    async def test_delete_nonexistent_returns_404(self, client: AsyncClient):
        resp = await client.delete("/api/family-members/nonexistent-id")
        assert resp.status_code == 404
