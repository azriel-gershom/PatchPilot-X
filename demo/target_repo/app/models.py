from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str


class User(BaseModel):
    id: int
    username: str
