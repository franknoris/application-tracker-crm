def _create_app(client, headers, org_id, program_name="OIST"):
    return client.post("/applications", json={"organization_id": org_id, "program_name": program_name}, headers=headers)


def test_create_interaction(client, auth_headers, org):
    app = _create_app(client, auth_headers, org.id).json()
    res = client.post(
        "/interactions",
        json={"application_id": app["id"], "channel": "email", "summary": "Emailed professor"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["occurred_at"] is not None


def test_list_interactions_by_application(client, auth_headers, org):
    app = _create_app(client, auth_headers, org.id).json()
    client.post(
        "/interactions",
        json={"application_id": app["id"], "channel": "call", "summary": "Called"},
        headers=auth_headers,
    )
    res = client.get(f"/interactions?application_id={app['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_invalid_channel(client, auth_headers):
    res = client.post("/interactions", json={"channel": "carrier-pigeon", "summary": "x"}, headers=auth_headers)
    assert res.status_code == 422
