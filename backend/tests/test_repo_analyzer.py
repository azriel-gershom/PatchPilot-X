import os

from app.services.repo_analyzer import RepoAnalyzer


def test_repo_analyzer(tmp_path):
    repo_dir = tmp_path / "test_repo"
    repo_dir.mkdir()

    main_py = repo_dir / "main.py"
    main_py.write_text(
        """
from fastapi import FastAPI
app = FastAPI()

@app.get('/users')
def get_users():
    return []

class User:
    pass
"""
    )

    test_py = repo_dir / "test_main.py"
    test_py.write_text("def test_get_users(): pass")

    reqs = repo_dir / "requirements.txt"
    reqs.write_text("fastapi")

    node_modules = repo_dir / "node_modules"
    node_modules.mkdir()
    (node_modules / "ignored.js").write_text("console.log()")

    analyzer = RepoAnalyzer()
    repo_map = analyzer.build_map(str(repo_dir))

    assert "main.py" in repo_map.source_files
    assert "test_main.py" in repo_map.test_files
    assert "requirements.txt" in repo_map.dependency_manifests
    assert "py" in repo_map.languages
    assert "get_users" in repo_map.functions
    assert "User" in repo_map.classes
    assert "fastapi.FastAPI" in repo_map.imports or "fastapi" in repo_map.imports
    assert "GET /users" in repo_map.api_routes
    assert "ignored.js" not in repo_map.source_files
