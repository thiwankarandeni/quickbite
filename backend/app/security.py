"""
Password hashing and JWT tokens.

CONCEPT: never store plain passwords
  We store a one-way hash (Argon2). At login we hash the submitted password
  the same way and compare. If the DB leaks, the passwords don't.

CONCEPT: JWT (JSON Web Token)
  A signed string holding a small JSON payload, e.g. {"sub": "<user id>", "exp": ...}.
  The server signs it with JWT_SECRET. Later, anyone can *read* the payload but
  only the server can *verify* the signature, so the server can trust it without
  a DB lookup for the session. Don't put secrets in the payload.
"""

from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.config import get_settings

_password_hash = PasswordHash.recommended()  # Argon2 with sensible defaults


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _password_hash.verify(password, hashed)


def create_access_token(user_id: str, role: str) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_expire_minutes)
    # "sub" (subject) and "exp" (expiry) are standard JWT claim names.
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Raises jwt.InvalidTokenError (incl. ExpiredSignatureError) if the token is bad."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
