"""
API tests for /auth. Each test follows the "Arrange, Act, Assert" pattern:
set up data, make one request, check the result.
"""

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.config import get_settings
from tests.conftest import bearer, register


def test_health(api):
    res = api.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_register_returns_token_and_user(api, sync_db):
    body = register(api, name="Ann", email="ann@test.com")

    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "ann@test.com"
    assert body["user"]["role"] == "customer"
    # response_model=UserOut must never leak the password hash.
    assert "password_hash" not in body["user"]

    # Check what was actually stored in MongoDB.
    stored = sync_db["users"].find_one({"email": "ann@test.com"})
    assert stored["password_hash"] != "secret123"


def test_register_ignores_role_from_client(api):
    # A malicious client tries to make itself an admin. Pydantic ignores the
    # unknown field and the route hard-codes role="customer".
    res = api.post(
        "/auth/register",
        json={"name": "Eve", "email": "eve@test.com", "password": "secret123", "role": "admin"},
    )
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "customer"


def test_register_duplicate_email_is_rejected(api):
    register(api, email="dup@test.com")
    # Same email in different case: emails are lower-cased before saving.
    res = api.post("/auth/register", json={"name": "X", "email": "DUP@test.com", "password": "secret123"})
    assert res.status_code == 409


# CONCEPT: parametrize
#   Runs the same test once per tuple, so one function covers many cases.
#   Each case shows up as a separate test in the output.
@pytest.mark.parametrize(
    "payload, bad_field",
    [
        ({"name": "A", "email": "not-an-email", "password": "secret123"}, "email"),
        ({"name": "A", "email": "a@test.com", "password": "123"}, "password"),
        ({"name": "", "email": "a@test.com", "password": "secret123"}, "name"),
        ({"email": "a@test.com", "password": "secret123"}, "name"),
    ],
)
def test_register_validation_errors(api, payload, bad_field):
    res = api.post("/auth/register", json=payload)
    assert res.status_code == 422  # Pydantic validation failed; route code never ran
    error_fields = [err["loc"][-1] for err in res.json()["detail"]]
    assert bad_field in error_fields


def test_login_success(api):
    register(api, email="bob@test.com", password="bobpass1")
    # /auth/login uses OAuth2 form data (data=...), not JSON (json=...).
    res = api.post("/auth/login", data={"username": "bob@test.com", "password": "bobpass1"})
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "bob@test.com"


def test_login_wrong_password_and_unknown_email_look_the_same(api):
    register(api, email="bob@test.com", password="bobpass1")
    wrong_pw = api.post("/auth/login", data={"username": "bob@test.com", "password": "nope"})
    no_user = api.post("/auth/login", data={"username": "ghost@test.com", "password": "nope"})

    assert wrong_pw.status_code == no_user.status_code == 401
    # Identical messages, so attackers can't use login to discover registered emails.
    assert wrong_pw.json() == no_user.json()


def test_me_returns_current_user(api, customer_headers):
    res = api.get("/auth/me", headers=customer_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "customer@test.com"


def test_me_requires_token(api):
    assert api.get("/auth/me").status_code == 401


def test_me_rejects_garbage_token(api):
    assert api.get("/auth/me", headers=bearer("not.a.jwt")).status_code == 401


def test_me_rejects_expired_token(api):
    user = register(api)["user"]
    settings = get_settings()
    expired = jwt.encode(
        {"sub": user["id"], "role": "customer", "exp": datetime.now(UTC) - timedelta(seconds=1)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    assert api.get("/auth/me", headers=bearer(expired)).status_code == 401


def test_token_of_deleted_user_is_rejected(api, sync_db):
    # The JWT is still validly signed, but the user no longer exists in the DB.
    token = register(api, email="gone@test.com")["access_token"]
    sync_db["users"].delete_one({"email": "gone@test.com"})
    assert api.get("/auth/me", headers=bearer(token)).status_code == 401
