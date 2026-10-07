# PatchPilot X

HNX26PSI09 — AI Software Engineering Agent

PatchPilot X is an AI software engineering agent that reads an existing codebase, understands a requested change, generates a minimal patch, and independently verifies that the patch does not break previously working behavior.

Code generation is probabilistic. Patch acceptance is deterministic.

## The Problem
Real repositories contain thousands of lines of code. Changes span across frontend, backend, test suites, and configurations. AI coding agents can generate plausible but incorrect code, often silently breaking existing behavior or hallucinating imports. Blindly trusting AI-generated code is dangerous.

## Our Solution
PatchPilot X operates on a zero-trust model for AI code generation. It follows a rigorous pipeline:
1. **Repository Intelligence**: Clone and map the entire structure.
2. **Baseline Testing**: Run the existing test suite to establish a clean state.
3. **Change Contract**: Identify what must change and what must be preserved.
4. **Blind Validation Plan**: Formulate adversarial edge cases *before* any code is generated.
5. **Code Generation & Patching**: Use localized context to generate the smallest correct patch.
6. **Deterministic Verification**: Check for regressions, hallucinated dependencies, and behavioral contract violations.
7. **Accept or Reject**: Explicitly ACCEPT or REJECT the patch based strictly on evidence, not LLM confidence.

## Core Innovation

### Behavioral Twin
PatchPilot X extracts the software's functional contract before and after the modification. It confirms that the exact endpoints and functions intended to change were modified, and that everything else was preserved. 

### Blind Test Chamber
Before writing a single line of code, the AI generates independent adversarial test cases. These tests act as an unbiased evaluator against the subsequently generated patch.

### Hallucination Guard
PatchPilot X performs static verification of imports, modules, and dependencies to ensure the AI did not hallucinate non-existent libraries or reference out-of-scope files.

### Regression Guard
By comparing the baseline test execution to the post-patch test execution, PatchPilot X deterministically counts new regressions. Even one new regression results in an immediate rejection.

### Deterministic Evidence Gate
The final decision is a boolean condition. If any mandatory verification gate fails (Regression, Hallucination, Build, or Blind Validation), the patch is decisively rejected.

## Architecture

```text
Repository
   ↓
Repository Intelligence
   ↓
Baseline Tests
   ↓
Behavioral Twin
   ↓
Change Contract
   ↓
Blind Test Planning
   ↓
Code Localization
   ↓
Patch Planning
   ↓
Patch Generation
   ↓
Targeted Testing
   ↓
Regression Guard
   ↓
Blind Test Chamber
   ↓
Behavioral Comparison
   ↓
Hallucination Guard
   ↓
Evidence Gate
   ↓
ACCEPT / REJECT
```

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend**: Python, FastAPI, Pytest, Pydantic
- **LLM**: Google Gemini 2.5 Pro
- **Execution**: Local Subprocess Sandbox

## Setup

### Prerequisites
- Node.js (v18+)
- npm
- Python (3.14+)
- Git

### Environment
Copy the example environment file and add your actual API key:
```bash
cp backend/.env.example backend/.env
```
Ensure `GEMINI_API_KEY` is set inside `backend/.env`.

### Run Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tests
**Backend Tests:**
```bash
cd backend
python -m pytest
```

**Frontend Build & Checks:**
```bash
cd frontend
npm run build
npm run lint
```

## Demos

### Success Demo
PatchPilot safely implements a new feature without breaking existing behavior.
**Request**: `Add case-insensitive username search while preserving existing user creation and ID lookup behavior.`
**Execution**: Start the application, input the target repository `https://github.com/azriel-gershom/PatchPilot-X.git`, input the request, and click **Deploy**.
**Result**: The Evidence Gate will return **PATCH ACCEPTED**.

### Rejection Demo
PatchPilot catches and rejects a patch that implements the new feature but breaks the `GET /users/{id}` endpoint.
**Execution**: Refer to `docs/demo-rejection.md`. The orchestration will automatically flag the `NEW_REGRESSION`.
**Result**: The Evidence Gate will return **PATCH REJECTED**.

## Limitations
- Blind test generation quality depends heavily on task context.
- Cross-language AST parsing (outside Python/TS) is currently limited.
- System depends on local execution sandbox, Docker isolation is an optional next step.

## Future Work
- Stronger multi-language AST parsing.
- Docker/VM isolated execution by default.
- PR Integration and GitHub App implementation.
- Automated code review comments.
