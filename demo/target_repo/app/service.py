from typing import List, Optional

from .models import User, UserCreate

# In-memory database
USERS: List[User] = []
NEXT_ID = 1


def reset_db():
    global USERS, NEXT_ID
    USERS = []
    NEXT_ID = 1


def create_user(user_create: UserCreate) -> User:
    global NEXT_ID
    new_user = User(id=NEXT_ID, username=user_create.username)
    USERS.append(new_user)
    NEXT_ID += 1
    return new_user


def list_users() -> List[User]:
    return USERS


def get_user_by_id(user_id: int) -> Optional[User]:
    for user in USERS:
        if user.id == user_id:
            return user
    return None
