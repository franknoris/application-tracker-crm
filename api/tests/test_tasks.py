from datetime import date, timedelta


def test_create_task(client, auth_headers):
    res = client.post("/tasks", json={"title": "Write cover letter"}, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["done"] is False


def test_due_tasks(client, auth_headers):
    soon = (date.today() + timedelta(days=2)).isoformat()
    later = (date.today() + timedelta(days=20)).isoformat()
    client.post("/tasks", json={"title": "Soon", "due_date": soon}, headers=auth_headers)
    client.post("/tasks", json={"title": "Later", "due_date": later}, headers=auth_headers)
    res = client.get("/tasks/due?within_days=7", headers=auth_headers)
    assert res.status_code == 200
    titles = [t["title"] for t in res.json()]
    assert "Soon" in titles
    assert "Later" not in titles


def test_overdue_tasks(client, auth_headers):
    past = (date.today() - timedelta(days=3)).isoformat()
    client.post("/tasks", json={"title": "Overdue", "due_date": past}, headers=auth_headers)
    res = client.get("/tasks/due?overdue=true", headers=auth_headers)
    assert res.status_code == 200
    assert any(t["title"] == "Overdue" for t in res.json())


def test_mark_done(client, auth_headers):
    task = client.post("/tasks", json={"title": "Finish"}, headers=auth_headers).json()
    res = client.patch(f"/tasks/{task['id']}", json={"done": True}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["done"] is True
