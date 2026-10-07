# PatchPilot X: Regression Rejection Demo (Phase 30)

This document describes how to verify PatchPilot X correctly rejects an AI-generated patch that successfully implements a new feature but breaks existing functionality.

## The Candidate Patch
Imagine an AI generator produces the following code in `app/routes.py` to support case-insensitive search:

```python
@router.get("", response_model=List[models.User])
def list_users(username: str = None):
    users = service.list_users()
    if username:
        return [u for u in users if u.username.lower() == username.lower()]
    return users
```
However, the AI accidentally alters the ID lookup:
```python
# Broken lookup!
@router.get("/{user_id}", response_model=models.User)
def get_user_by_id(user_id: int):
    # returning the first user instead of the matching ID
    user = service.list_users()[0] if service.list_users() else None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## How PatchPilot Detects the Regression
1. PatchPilot applies the candidate patch in the isolated Blind Test Chamber.
2. The Targeted Tests verify the new `username` query works. (PASS)
3. The **Regression Guard** executes the original test suite:
   - `test_create_user` (PASS)
   - `test_list_users` (PASS)
   - `test_get_user_by_id` (**FAIL**)

## Evidence Gate Evaluation
- **Baseline:** 4 PASS, 0 FAIL
- **After Patch:** 3 PASS, 1 FAIL
- **Classification:** `1 NEW_REGRESSION`
- **Result:** The Evidence Gate deterministically returns **PATCH REJECTED** because a new regression was introduced. The patch is safely discarded.
