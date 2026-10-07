# Demo Target Repository

This is a simple FastAPI application used as a target repository to demonstrate PatchPilot X.

## Features
- User creation (`POST /users`)
- List users (`GET /users`)
- Get user by ID (`GET /users/{id}`)

## Setup
```bash
pip install -r requirements.txt
```

## Running Tests
```bash
python -m pytest
```

## Running the App
```bash
uvicorn app.main:app --reload
```
