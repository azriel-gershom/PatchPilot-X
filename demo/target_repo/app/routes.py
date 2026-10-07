from typing import List

from fastapi import APIRouter, HTTPException

from . import models, service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=models.User, status_code=201)
def create_user(user: models.UserCreate):
    return service.create_user(user)


@router.get("", response_model=List[models.User])
def list_users():
    return service.list_users()


@router.get("/{user_id}", response_model=models.User)
def get_user_by_id(user_id: int):
    user = service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
