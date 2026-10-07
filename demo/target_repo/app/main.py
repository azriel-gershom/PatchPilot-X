from fastapi import FastAPI

from .routes import router as users_router

app = FastAPI(title="Demo Target API")

app.include_router(users_router)


@app.get("/")
def health_check():
    return {"status": "ok"}
