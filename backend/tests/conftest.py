"""
Test configuration and shared fixtures for Financializer API tests.

Uses an in-memory SQLite database so tests run without a live PostgreSQL
instance.  The application's get_db dependency is overridden to point at
the SQLite session, and roles are seeded manually because the lifespan
startup uses the real engine (which is safely skipped via try/except).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db import models
from app.core import security

# ── In-memory SQLite engine (isolated per test session) ───────────────────────

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def db_session():
    """
    Create all tables in the SQLite test DB and seed the three canonical roles.
    Teardown drops all tables after the module finishes.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed canonical roles (mirroring the production lifespan startup)
    for role_name in ["Admin", "Analyst", "Viewer"]:
        if not db.query(models.Role).filter(models.Role.name == role_name).first():
            db.add(models.Role(name=role_name, description=f"{role_name} Role"))
    db.commit()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client(db_session):
    """
    FastAPI TestClient wired to the SQLite session via dependency override.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # session lifecycle managed by db_session fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def admin_token(client, db_session):
    """
    Create a dedicated test admin user and return a valid JWT bearer token.
    The admin user is inserted directly via SQLAlchemy to avoid depending on
    the /users/ endpoint (which defaults to Viewer role).
    """
    admin_role = db_session.query(models.Role).filter(models.Role.name == "Admin").first()

    # Guard: avoid duplicate inserts across test reruns
    existing = db_session.query(models.User).filter(models.User.username == "testadmin").first()
    if not existing:
        admin_user = models.User(
            username="testadmin",
            email="testadmin@financializer.test",
            hashed_password=security.get_password_hash("AdminPass123"),
            is_active=True,
        )
        if admin_role:
            admin_user.roles.append(admin_role)
        db_session.add(admin_user)
        db_session.commit()

    response = client.post(
        "/api/auth/login",
        data={"username": "testadmin", "password": "AdminPass123"},
    )
    assert response.status_code == 200, "Admin fixture login failed"
    return response.json()["access_token"]
