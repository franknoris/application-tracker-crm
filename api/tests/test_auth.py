def test_register_and_login(client):
    res = client.post("/auth/register", json={"email": "new@example.com", "password": "password123"})
    assert res.status_code == 201
    assert res.json()["email"] == "new@example.com"

    res = client.post("/auth/login", json={"email": "new@example.com", "password": "password123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_register_duplicate_email(client):
    client.post("/auth/register", json={"email": "dup@example.com", "password": "password123"})
    res = client.post("/auth/register", json={"email": "dup@example.com", "password": "password123"})
    assert res.status_code == 409


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "x@example.com", "password": "password123"})
    res = client.post("/auth/login", json={"email": "x@example.com", "password": "wrongpassword"})
    assert res.status_code == 401


def test_register_invalid_email(client):
    res = client.post("/auth/register", json={"email": "not-an-email", "password": "password123"})
    assert res.status_code == 422


def test_register_short_password(client):
    res = client.post("/auth/register", json={"email": "x@example.com", "password": "short"})
    assert res.status_code == 422


def test_me_requires_auth(client):
    res = client.get("/auth/me")
    assert res.status_code == 401


def test_me_with_token(client, auth_headers):
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "a@example.com"
