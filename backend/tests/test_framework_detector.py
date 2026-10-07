import os
import json
from app.services.framework_detector import FrameworkDetector

def test_detect_python_fastapi(tmp_path):
    workspace = tmp_path / "python_repo"
    workspace.mkdir()
    (workspace / "requirements.txt").write_text("fastapi==0.100.0\npytest==7.0.0")
    
    detector = FrameworkDetector()
    info = detector.detect(str(workspace))
    
    assert info.language == "PYTHON"
    assert info.framework == "FastAPI"
    assert info.package_manager == "pip"
    assert info.test_command == "pytest"
    assert info.confidence >= 0.9

def test_detect_js_nextjs(tmp_path):
    workspace = tmp_path / "js_repo"
    workspace.mkdir()
    
    pkg = {
        "dependencies": {
            "next": "13.0.0",
            "react": "18.0.0",
            "typescript": "5.0.0"
        },
        "scripts": {
            "test": "jest",
            "build": "next build",
            "lint": "eslint ."
        }
    }
    
    with open(workspace / "package.json", "w") as f:
        json.dump(pkg, f)
        
    (workspace / "yarn.lock").write_text("")
        
    detector = FrameworkDetector()
    info = detector.detect(str(workspace))
    
    assert info.language == "TYPESCRIPT"
    assert info.framework == "Next.js"
    assert info.package_manager == "yarn"
    assert info.test_command == "yarn test"
    assert info.build_command == "yarn build"
    assert info.lint_command == "yarn lint"
    assert info.confidence >= 0.9

def test_detect_java_maven(tmp_path):
    workspace = tmp_path / "java_repo"
    workspace.mkdir()
    (workspace / "pom.xml").write_text("<project></project>")
    
    detector = FrameworkDetector()
    info = detector.detect(str(workspace))
    
    assert info.language == "JAVA"
    assert info.package_manager == "maven"
    assert info.test_command == "mvn test"
    
def test_detect_unknown(tmp_path):
    workspace = tmp_path / "empty_repo"
    workspace.mkdir()
    
    detector = FrameworkDetector()
    info = detector.detect(str(workspace))
    
    assert info.language == "UNKNOWN"
    assert info.confidence == 0.0
