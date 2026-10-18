"""
User schemas.

CONCEPT: separate models for input and output
  - UserCreate: what the client sends (includes the plain password).
  - UserOut:    what we send back (never includes the password hash).
  Using `response_model=UserOut` on a route guarantees FastAPI strips any field
  not in UserOut, even if the dict we return has more.
"""

from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.models.common import PyObjectId

Role = Literal["customer", "admin"]


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr  # validated as a real email format; requires `email-validator`
    password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: PyObjectId
    name: str
    email: EmailStr
    role: Role


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
