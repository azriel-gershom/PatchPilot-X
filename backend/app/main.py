from fastapi import FastAPI

app = FastAPI(title="PatchPilot X", description="AI Software Engineering Agent")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "PatchPilot X"
    }
