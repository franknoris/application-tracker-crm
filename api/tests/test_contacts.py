def test_create_contact_with_org(client, auth_headers, org):
    res = client.post(
        "/contacts",
        json={"name": "Dr. Smith", "email": "smith@example.com", "organization_id": org.id},
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["organization_id"] == org.id


def test_create_contact_invalid_email(client, auth_headers):
    res = client.post("/contacts", json={"name": "Bad", "email": "not-an-email"}, headers=auth_headers)
    assert res.status_code == 422


def test_contact_cannot_reference_other_org(client, other_headers, org):
    res = client.post(
        "/contacts",
        json={"name": "Hacker", "organization_id": org.id},
        headers=other_headers,
    )
    assert res.status_code == 404


def test_search_contacts(client, auth_headers):
    client.post("/contacts", json={"name": "Alice"}, headers=auth_headers)
    client.post("/contacts", json={"name": "Bob"}, headers=auth_headers)
    res = client.get("/contacts?search=ali", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Alice"
