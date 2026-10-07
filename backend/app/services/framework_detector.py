import json
import os

from app.models.domain import FrameworkInfo


class FrameworkDetector:
    def detect(self, workspace_path: str) -> FrameworkInfo:
        evidence = []

        info = FrameworkInfo(
            language="UNKNOWN",
            framework=None,
            package_manager=None,
            test_command=None,
            build_command=None,
            lint_command=None,
            typecheck_command=None,
            confidence=0.0,
            evidence=evidence,
        )

        # Check Node.js / JS / TS
        package_json_path = os.path.join(workspace_path, "package.json")
        if os.path.exists(package_json_path):
            info.language = "JAVASCRIPT"
            info.package_manager = "npm"
            if os.path.exists(os.path.join(workspace_path, "yarn.lock")):
                info.package_manager = "yarn"
            elif os.path.exists(os.path.join(workspace_path, "pnpm-lock.yaml")):
                info.package_manager = "pnpm"

            evidence.append("Found package.json")

            try:
                with open(package_json_path, "r", encoding="utf-8") as f:
                    pkg = json.load(f)

                deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                scripts = pkg.get("scripts", {})

                # Detect framework
                if "next" in deps:
                    info.framework = "Next.js"
                    evidence.append("Found next dependency")
                elif "react" in deps:
                    info.framework = "React"
                    evidence.append("Found react dependency")
                elif "express" in deps:
                    info.framework = "Express"
                    evidence.append("Found express dependency")

                if "typescript" in deps:
                    info.language = "TYPESCRIPT"
                    evidence.append("Found typescript dependency")

                # Detect commands
                pm_cmd = (
                    info.package_manager if info.package_manager != "npm" else "npm run"
                )
                if "test" in scripts:
                    info.test_command = (
                        "npm test"
                        if info.package_manager == "npm"
                        else f"{info.package_manager} test"
                    )
                    evidence.append(f"Found test script: {scripts['test']}")
                if "build" in scripts:
                    info.build_command = f"{pm_cmd} build"
                    evidence.append(f"Found build script")
                if "lint" in scripts:
                    info.lint_command = f"{pm_cmd} lint"
                    evidence.append(f"Found lint script")
                if "typecheck" in scripts:
                    info.typecheck_command = f"{pm_cmd} typecheck"
                    evidence.append(f"Found typecheck script")

                info.confidence = 0.9
                info.evidence = evidence
                return info
            except Exception as e:
                evidence.append(f"Error parsing package.json: {e}")

        # Check Python
        pyproject_path = os.path.join(workspace_path, "pyproject.toml")
        reqs_path = os.path.join(workspace_path, "requirements.txt")
        setup_path = os.path.join(workspace_path, "setup.py")

        is_python = False
        if os.path.exists(pyproject_path):
            is_python = True
            info.package_manager = "pip"
            evidence.append("Found pyproject.toml")
        if os.path.exists(reqs_path):
            is_python = True
            info.package_manager = "pip"
            evidence.append("Found requirements.txt")
        if os.path.exists(setup_path):
            is_python = True
            info.package_manager = "pip"
            evidence.append("Found setup.py")

        if is_python:
            info.language = "PYTHON"
            info.confidence = 0.9

            content = ""
            for path in [pyproject_path, reqs_path, setup_path]:
                if os.path.exists(path):
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            content += f.read() + "\n"
                    except Exception:
                        pass

            if "fastapi" in content.lower():
                info.framework = "FastAPI"
                evidence.append("Found fastapi reference")
            elif "flask" in content.lower():
                info.framework = "Flask"
                evidence.append("Found flask reference")
            elif "django" in content.lower():
                info.framework = "Django"
                evidence.append("Found django reference")

            if "pytest" in content.lower():
                info.test_command = "pytest"
                evidence.append("Found pytest reference")
            elif "unittest" in content.lower():
                info.test_command = "python -m unittest discover"
                evidence.append("Found unittest reference")

            info.evidence = evidence
            return info

        # Check Java Maven
        if os.path.exists(os.path.join(workspace_path, "pom.xml")):
            info.language = "JAVA"
            info.package_manager = "maven"
            info.test_command = "mvn test"
            info.build_command = "mvn package"
            info.confidence = 0.8
            evidence.append("Found pom.xml")
            info.evidence = evidence
            return info

        # Check Java Gradle
        if os.path.exists(
            os.path.join(workspace_path, "build.gradle")
        ) or os.path.exists(os.path.join(workspace_path, "build.gradle.kts")):
            info.language = "JAVA"
            info.package_manager = "gradle"
            info.test_command = (
                "./gradlew test"
                if os.path.exists(os.path.join(workspace_path, "gradlew"))
                else "gradle test"
            )
            info.build_command = (
                "./gradlew build"
                if os.path.exists(os.path.join(workspace_path, "gradlew"))
                else "gradle build"
            )
            info.confidence = 0.8
            evidence.append("Found build.gradle")
            info.evidence = evidence
            return info

        # Check Go
        if os.path.exists(os.path.join(workspace_path, "go.mod")):
            info.language = "GO"
            info.package_manager = "go modules"
            info.test_command = "go test ./..."
            info.build_command = "go build ./..."
            info.confidence = 0.8
            evidence.append("Found go.mod")
            info.evidence = evidence
            return info

        # Check Rust
        if os.path.exists(os.path.join(workspace_path, "Cargo.toml")):
            info.language = "RUST"
            info.package_manager = "cargo"
            info.test_command = "cargo test"
            info.build_command = "cargo build"
            info.confidence = 0.8
            evidence.append("Found Cargo.toml")
            info.evidence = evidence
            return info

        info.evidence = evidence
        return info
