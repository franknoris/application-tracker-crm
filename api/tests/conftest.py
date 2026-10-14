import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import Organization, User
from app.security import hash_password

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db():
    session = TestingSessionLocal()
    yield session
    session.close()


def _create_user(session, email, password="password123"):
    user = User(email=email, password_hash=hash_password(password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def user(db):
    return _create_user(db, "a@example.com")


@pytest.fixture
def other_user(db):
    return _create_user(db, "b@example.com")


@pytest.fixture
def org(db, user):
    organization = Organization(user_id=user.id, name="Example Institute")
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization


@pytest.fixture
def token(client, user):
    res = client.post("/auth/login", json={"email": "a@example.com", "password": "password123"})
    return res.json()["access_token"]


@pytest.fixture
def other_token(client, other_user):
    res = client.post("/auth/login", json={"email": "b@example.com", "password": "password123"})
    return res.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_headers(other_token):
    return {"Authorization": f"Bearer {other_token}"}
