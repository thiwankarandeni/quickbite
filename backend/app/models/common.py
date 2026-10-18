"""
Helpers shared by all models.

CONCEPT: ObjectId <-> string
  MongoDB's _id is a BSON ObjectId, which JSON can't represent. Our API always
  exposes it as a plain string field called "id", and converts back to ObjectId
  when querying.
"""

from typing import Annotated

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pydantic import BeforeValidator

# Annotated[...] attaches extra behaviour to a type. BeforeValidator runs before
# Pydantic's own str validation, so an ObjectId coming from Mongo becomes a str.
PyObjectId = Annotated[str, BeforeValidator(str)]


def to_object_id(value: str) -> ObjectId:
    """Convert a path param like "/menu/abc" into an ObjectId, or return 404."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        # An invalid id can't match any document, so "not found" is the honest answer.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")


def doc_to_dict(doc: dict) -> dict:
    """Rename Mongo's `_id` to `id` so it matches our Pydantic "Out" models."""
    doc = dict(doc)
    doc["id"] = doc.pop("_id")
    return doc
