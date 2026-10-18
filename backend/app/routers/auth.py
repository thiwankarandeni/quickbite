"""
Auth routes: register, login, and "who am I".

CONCEPT: APIRouter
  Each router groups related endpoints. main.py mounts it with
  `app.include_router(...)`. `prefix` is prepended to every path and `tags`
  groups the endpoints on the /docs page.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pymongo.errors import DuplicateKeyError

from app.deps import CurrentUser, Db
from app.models.common import doc_to_dict
from app.models.user import Token, UserCreate, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: dict) -> Token:
    return Token(
        access_token=create_access_token(str(user["id"]), user["role"]),
        user=UserOut(**user),
    )


# status_code=201 means "Created". response_model filters and documents the output.
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, db: Db):
    # `body: UserCreate` means FastAPI parses the JSON body and validates it.
    # If validation fails, the client gets a 422 with details, and this code never runs.
    doc = {
        "name": body.name,
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "role": "customer",  # never let the client choose its own role
    }
    try:
        result = await db["users"].insert_one(doc)
    except DuplicateKeyError:
        # Raised because of the unique index on email (see db.create_indexes).
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    doc["_id"] = result.inserted_id
    return _token_response(doc_to_dict(doc))


@router.post("/login", response_model=Token)
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: Db):
    # OAuth2PasswordRequestForm reads *form data* (not JSON) with fields
    # "username" and "password". That's the OAuth2 standard, and it is what the
    # /docs "Authorize" button sends. We use the email as the username.
    user = await db["users"].find_one({"email": form.username.lower()})
    if user is None or not verify_password(form.password, user["password_hash"]):
        # Same message for both cases so attackers can't discover which emails exist.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return _token_response(doc_to_dict(user))


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    # All the work happened in the get_current_user dependency.
    return user
