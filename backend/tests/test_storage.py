import os
from app.core.storage import create_run, save_artifact, load_artifact, BASE_DIR

def test_run_creation():
    run_id = create_run()
    assert run_id is not None
    assert os.path.exists(os.path.join(BASE_DIR, run_id))

def test_save_and_load_artifact():
    run_id = create_run()
    data = {"key": "value", "list": [1, 2, 3]}
    save_artifact(run_id, "test_artifact", data)
    
    loaded = load_artifact(run_id, "test_artifact")
    assert loaded == data
    
    missing = load_artifact(run_id, "nonexistent")
    assert missing is None
