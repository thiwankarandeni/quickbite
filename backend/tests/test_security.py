"""
Pure UNIT tests: they call functions directly, with no HTTP and no database.
They're the fastest kind of test. Notice they don't use the `api` fixture, so
they don't even need MongoDB to be reachable.
"""

from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.config import get_settings
from app.security import create_access_token, decode_access_token, hash_password, verify_password


def test_hash_is_not_the_plain_password():
    hashed = hash_password("hunter22")
    assert hashed != "hunter22"
    assert hashed.startswith("$argon2")  # the algorithm is recorded in the hash itself


def test_same_password_hashes_differently_each_time():
    # Each hash gets a random "salt", so two users with the same password
    # don't end up with the same hash.
    assert hash_password("same") != hash_password("same")


def test_verify_password():
    hashed = hash_password("correct horse")
    assert verify_password("correct horse", hashed)
    assert not verify_password("wrong horse", hashed)


def test_token_round_trip():
    token = create_access_token("user-123", "customer")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "customer"
    assert "exp" in payload


def test_tampered_token_is_rejected():
    token = create_access_token("user-123", "customer")
    # Signing with a different secret simulates an attacker forging a token.
    forged = jwt.encode({"sub": "user-123", "role": "admin"}, "an-attackers-guessed-secret-of-32-plus-bytes", algorithm="HS256")
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(forged)
    # Sanity check: the genuine token still works.
    assert decode_access_token(token)["sub"] == "user-123"


def test_expired_token_is_rejected():
    settings = get_settings()
    expired = jwt.encode(
        {"sub": "user-123", "role": "customer", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    # pytest.raises asserts that the code inside the block raises this exception.
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(expired)
