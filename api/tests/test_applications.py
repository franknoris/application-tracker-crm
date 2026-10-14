from datetime import datetime, timedelta, timezone


def _create_app(client, headers, org_id, program_name="OIST", deadline=None):
    payload = {"organization_id": org_id, "program_name": program_name}
    if deadline is not None:
        payload["deadline"] = deadline
    return client.post("/applications", json=payload, headers=headers)


def test_create_application(client, auth_headers, org):
    res = _create_app(client, auth_headers, org.id)
    assert res.status_code == 201
    assert res.json()["stage"] == "researching"


def test_filter_by_stage(client, auth_headers, org):
    app = _create_app(client, auth_headers, org.id, program_name="HENNGE").json()
    client.patch(f"/applications/{app['id']}", json={"stage": "contacted"}, headers=auth_headers)
    client.patch(f"/applications/{app['id']}", json={"stage": "applying"}, headers=auth_headers)
    res = client.get("/applications?stage=applying", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_valid_stage_transition(client, auth_headers, org):
    app = _create_app(client, auth_headers, org.id).json()
    res = client.patch(f"/applications/{app['id']}", json={"stage": "contacted"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["stage"] == "contacted"


def test_invalid_stage_transition(client, auth_headers, org):
    app = _create_app(client, auth_headers, org.id).json()
    res = client.patch(f"/applications/{app['id']}", json={"stage": "submitted"}, headers=auth_headers)
    assert res.status_code == 400


def test_rejected_allowed_from_any_stage(client, auth_headers, org):
    app = _create_app(client, auth_headers, org.id).json()
    res = client.patch(f"/applications/{app['id']}", json={"stage": "rejected"}, headers=auth_headers)
    assert res.status_code == 200


def test_upcoming(client, auth_headers, org):
    soon = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    later = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    _create_app(client, auth_headers, org.id, program_name="Due soon", deadline=soon)
    _create_app(client, auth_headers, org.id, program_name="Due later", deadline=later)
    res = client.get("/applications/upcoming?days=7", headers=auth_headers)
    assert res.status_code == 200
    names = [a["program_name"] for a in res.json()]
    assert "Due soon" in names
    assert "Due later" not in names
