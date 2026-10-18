"""
Reusable FastAPI dependencies.

CONCEPT: dependency injection with Depends()
  A route can declare a parameter like `user = Depends(get_current_user)`.
  Before the route runs, FastAPI calls get_current_user (which itself depends on
  the token and the db), and passes the result in. Dependencies can chain:

      require_admin -> get_current_user -> (oauth2_scheme, get_db)

  If any dependency raises HTTPException, the route never runs.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pymongo.asynchronous.database import AsyncDatabase

from app.db import get_db
from app.models.common import doc_to_dict, to_object_id
from app.security import decode_access_token

# Reads the "Authorization: Bearer <token>" header. tokenUrl tells the /docs page
# where to log in, which adds the "Authorize" button there.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Annotated aliases keep route signatures short: `db: Db` instead of the full Depends.
Db = Annotated[AsyncDatabase, Depends(get_db)]


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Db) -> dict:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
    except jwt.InvalidTokenError:
        raise unauthorized

    user = await db["users"].find_one({"_id": to_object_id(payload["sub"])})
    if user is None:
        raise unauthorized
    return doc_to_dict(user)


CurrentUser = Annotated[dict, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> dict:
    # The role check lives on the SERVER. Hiding admin links in the UI is just UX;
    # this check is the real security.
    if user["role"] != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admins only")
    return user


AdminUser = Annotated[dict, Depends(require_admin)]
