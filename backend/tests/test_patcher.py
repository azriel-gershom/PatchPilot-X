import os

import pytest
from app.sandbox.patcher import PatchGenerator


def test_generate_patch():
    patcher = PatchGenerator()
    mods = [
        {
            "file_path": "src/a.py",
            "original": "def a(): pass\n",
            "modified": "def a(): return 1\n",
        },
        {"file_path": "src/b.py", "original": "b\n", "modified": "b\n"},
    ]

    patch = patcher.generate_patch(mods)
    assert "--- a/src/a.py" in patch
    assert "+def a(): return 1" in patch
    assert "--- a/src/b.py" not in patch


def test_generate_and_save_patch(tmp_path, monkeypatch):
    monkeypatch.setattr("app.sandbox.patcher.BASE_DIR", str(tmp_path))

    patcher = PatchGenerator()
    mods = [
        {
            "file_path": "src/a.py",
            "original": "def a(): pass\n",
            "modified": "def a(): return 1\n",
        }
    ]

    patch = patcher.generate_and_save_patch("test_run", mods)

    patch_file = tmp_path / "test_run" / "patch.diff"
    assert patch_file.exists()
    content = patch_file.read_text(encoding="utf-8")
    assert "--- a/src/a.py" in content
