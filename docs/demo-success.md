# PatchPilot X: Safe Patch Demo (Phase 29)

This document describes how to verify PatchPilot X successfully implementing a new feature in the target repository without breaking existing functionality.

## Target Repository Setup
The demo uses the `demo/target_repo` contained in this project, which implements a basic FastAPI application.

**Initial Functionality:**
- `POST /users` (Create user)
- `GET /users` (List all users)
- `GET /users/{id}` (Get user by ID)

## The Request
We ask PatchPilot X to perform the following:
> "Add case-insensitive username search while preserving existing user creation and ID lookup behavior."

## How to Execute the Run
1. Start the PatchPilot backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```
2. Start the PatchPilot frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open the Verification Arena UI at `http://localhost:5173`.
4. Enter the GitHub URL corresponding to the target repository (or local path if supported).
5. Enter the exact request above.
6. Click **Deploy Agent to Blind Test Chamber**.

## Expected Evidence & Results
- **Behavioral Twin BEFORE**: Captures the existing `GET /users` and `GET /users/{id}` routes.
- **Blind Plan**: Plans validation cases for empty inputs, existing IDs, and the new username search case-insensitivity.
- **Patch Summary**: Generates a patch to `app/service.py` and `app/routes.py` allowing a `username` query parameter.
- **Targeted Tests**: Verifies the new logic successfully executes.
- **Regression Tests**: Confirms `0 NEW REGRESSIONS` (original test suite passes).
- **Hallucination Guard**: Confirms no hallucinated imports were added.
- **Evidence Gate**: Deterministically evaluates to **PATCH ACCEPTED**.
