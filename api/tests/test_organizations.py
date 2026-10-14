def test_create_and_list(client, auth_headers):
    res = client.post("/organizations", json={"name": "Example Institute"}, headers=auth_headers)
    assert res.status_code == 201
    org_id = res.json()["id"]

    res = client.get("/organizations", headers=auth_headers)
    assert res.status_code == 200
    assert any(o["id"] == org_id for o in res.json())


def test_get_not_found(client, auth_headers):
    res = client.get("/organizations/9999", headers=auth_headers)
    assert res.status_code == 404


def test_create_empty_name(client, auth_headers):
    res = client.post("/organizations", json={"name": ""}, headers=auth_headers)
    assert res.status_code == 422


def test_update(client, auth_headers):
    res = client.post("/organizations", json={"name": "Old Name"}, headers=auth_headers)
    org_id = res.json()["id"]
    res = client.patch(f"/organizations/{org_id}", json={"name": "New Name"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "New Name"


def test_delete(client, auth_headers):
    res = client.post("/organizations", json={"name": "Temp"}, headers=auth_headers)
    org_id = res.json()["id"]
    res = client.delete(f"/organizations/{org_id}", headers=auth_headers)
    assert res.status_code == 204
    res = client.get(f"/organizations/{org_id}", headers=auth_headers)
    assert res.status_code == 404
