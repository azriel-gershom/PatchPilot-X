# PatchPilot X: Verification Arena

![PatchPilot X](https://img.shields.io/badge/PatchPilot-X-blue.svg) ![Build Status](https://github.com/azriel-gershom/PatchPilot-X/actions/workflows/ci.yml/badge.svg)

**HNX26PSI09 — AI Software Engineering Agent**

PatchPilot X is an AI-powered Software Engineering Agent that doesn't just write code—it proves it works. 

The **Verification Arena** introduces deterministic validation for probabilistic LLM outputs using three core systems:
1. **Behavioral Twin**: Simulates the target repository environment dynamically.
2. **Blind Test Chamber**: Executes regression and functional tests in an isolated sandbox.
3. **Evidence Gate**: Rejects hallucinatory imports and enforces deterministic passing of all acceptance criteria before patch approval.

## Features
- **Deterministic Validation**: Code is never merged without passing rigorous tests.
- **Multi-File Contextual Generation**: Understands broad architectural constraints.
- **Pre-commit Hooks & CI**: Automates formatting (`black`, `isort`) and CI testing.
- **Beautiful Verification Dashboard**: A React frontend to deploy and monitor agents.
- **Dockerized Environment**: Ready to deploy anywhere.

## Quickstart
```bash
# Clone the repository
git clone https://github.com/azriel-gershom/PatchPilot-X.git
cd PatchPilot-X

# Run with Docker Compose
docker-compose up --build
```

Access the Verification Dashboard at `http://localhost:5173`.

## Architecture
- **Backend**: FastAPI, Python 3.12+, LLM Integration (Gemini 1.5 Pro).
- **Frontend**: React 19, Vite, Tailwind CSS 4, Lucide Icons.
- **Sandbox**: Containerized TestRunner, RepoAnalyzer, FrameworkDetector.
