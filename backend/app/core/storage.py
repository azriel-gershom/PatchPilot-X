import json
import os
import uuid

from pydantic import BaseModel

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../.patchpilot/runs")
)


def create_run() -> str:
    run_id = str(uuid.uuid4())
    run_dir = os.path.join(BASE_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)
    return run_id


def save_artifact(run_id: str, name: str, data: BaseModel | dict):
    run_dir = os.path.join(BASE_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)
    file_path = os.path.join(run_dir, f"{name}.json")

    with open(file_path, "w", encoding="utf-8") as f:
        if isinstance(data, BaseModel):
            f.write(data.model_dump_json(indent=2))
        else:
            json.dump(data, f, indent=2)


def load_artifact(run_id: str, name: str) -> dict | None:
    file_path = os.path.join(BASE_DIR, run_id, f"{name}.json")
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
