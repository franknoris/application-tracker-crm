def test_cannot_read_other_org(client, other_headers, org):
    res = client.get(f"/organizations/{org.id}", headers=other_headers)
    assert res.status_code == 404


def test_cannot_update_other_org(client, other_headers, org):
    res = client.patch(f"/organizations/{org.id}", json={"name": "Hacked"}, headers=other_headers)
    assert res.status_code == 404


def test_cannot_delete_other_org(client, other_headers, org):
    res = client.delete(f"/organizations/{org.id}", headers=other_headers)
    assert res.status_code == 404


def test_lists_are_isolated(client, other_headers, org):
    res = client.get("/organizations", headers=other_headers)
    assert res.status_code == 200
    assert res.json() == []


def test_cannot_read_other_application(client, auth_headers, other_headers, org):
    app = client.post(
        "/applications", json={"organization_id": org.id, "program_name": "OIST"}, headers=auth_headers
    ).json()
    res = client.get(f"/applications/{app['id']}", headers=other_headers)
    assert res.status_code == 404
