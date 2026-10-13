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

        def find_manifest(filename: str):
            root_path = os.path.join(workspace_path, filename)
            if os.path.exists(root_path):
                return root_path, ""
            
            for d in os.listdir(workspace_path):
                d_path = os.path.join(workspace_path, d)
                if os.path.isdir(d_path) and not d.startswith('.'):
                    file_path = os.path.join(d_path, filename)
                    if os.path.exists(file_path):
                        return file_path, d
            return None, None

        # Check Node.js / JS / TS
        package_json_path, pkg_dir = find_manifest("package.json")
        if package_json_path:
            info.language = "JAVASCRIPT"
            info.package_manager = "npm"
            if os.path.exists(os.path.join(os.path.dirname(package_json_path), "yarn.lock")):
                info.package_manager = "yarn"
            elif os.path.exists(os.path.join(os.path.dirname(package_json_path), "pnpm-lock.yaml")):
                info.package_manager = "pnpm"

            evidence.append(f"Found package.json in {pkg_dir or 'root'}")

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
                prefix_arg = f" --prefix {pkg_dir}" if pkg_dir and info.package_manager == "npm" else (f" --cwd {pkg_dir}" if pkg_dir else "")
                
                if "test" in scripts:
                    info.test_command = (
                        f"npm{prefix_arg} test"
                        if info.package_manager == "npm"
                        else f"{info.package_manager}{prefix_arg} test"
                    )
                    evidence.append(f"Found test script: {scripts['test']}")
                if "build" in scripts:
                    info.build_command = f"{pm_cmd}{prefix_arg} build"
                    evidence.append(f"Found build script")
                if "lint" in scripts:
                    info.lint_command = f"{pm_cmd}{prefix_arg} lint"
                    evidence.append(f"Found lint script")
                if "typecheck" in scripts:
                    info.typecheck_command = f"{pm_cmd}{prefix_arg} typecheck"
                    evidence.append(f"Found typecheck script")

                info.confidence = 0.9
                info.evidence = evidence
                return info
            except Exception as e:
                evidence.append(f"Error parsing package.json: {e}")

        # Check Python
        pyproject_path, py_dir1 = find_manifest("pyproject.toml")
        reqs_path, py_dir2 = find_manifest("requirements.txt")
        setup_path, py_dir3 = find_manifest("setup.py")
        
        py_dir = py_dir1 or py_dir2 or py_dir3

        is_python = False
        if pyproject_path:
            is_python = True
            info.package_manager = "pip"
            evidence.append(f"Found pyproject.toml in {py_dir1 or 'root'}")
        if reqs_path:
            is_python = True
            info.package_manager = "pip"
            evidence.append(f"Found requirements.txt in {py_dir2 or 'root'}")
        if setup_path:
            is_python = True
            info.package_manager = "pip"
            evidence.append(f"Found setup.py in {py_dir3 or 'root'}")

        if is_python:
            info.language = "PYTHON"
            info.confidence = 0.9

            content = ""
            for path in [pyproject_path, reqs_path, setup_path]:
                if path and os.path.exists(path):
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

            dir_arg = f" {py_dir}" if py_dir else ""
            if "pytest" in content.lower():
                info.test_command = f"pytest{dir_arg}"
                evidence.append("Found pytest reference")
            elif "unittest" in content.lower():
                info.test_command = f"python -m unittest discover{dir_arg}"
                evidence.append("Found unittest reference")

            info.evidence = evidence
            return info

        # Check Java Maven
        pom_path, java_dir = find_manifest("pom.xml")
        if pom_path:
            info.language = "JAVA"
            info.package_manager = "maven"
            file_arg = f" -f {java_dir}/pom.xml" if java_dir else ""
            info.test_command = f"mvn test{file_arg}"
            info.build_command = f"mvn package{file_arg}"
            info.confidence = 0.8
            evidence.append(f"Found pom.xml in {java_dir or 'root'}")
            info.evidence = evidence
            return info

        # Check Java Gradle
        gradle_path, gradle_dir = find_manifest("build.gradle")
        if not gradle_path:
            gradle_path, gradle_dir = find_manifest("build.gradle.kts")
            
        if gradle_path:
            info.language = "JAVA"
            info.package_manager = "gradle"
            dir_arg = f" -p {gradle_dir}" if gradle_dir else ""
            
            wrapper_path = os.path.join(workspace_path, gradle_dir or "", "gradlew")
            if os.path.exists(wrapper_path):
                cmd = f"{wrapper_path}"
            else:
                cmd = "gradle"
                
            info.test_command = f"{cmd}{dir_arg} test"
            info.build_command = f"{cmd}{dir_arg} build"
            info.confidence = 0.8
            evidence.append(f"Found build.gradle in {gradle_dir or 'root'}")
            info.evidence = evidence
            return info

        # Check Go
        go_path, go_dir = find_manifest("go.mod")
        if go_path:
            info.language = "GO"
            info.package_manager = "go modules"
            dir_arg = f" ./{go_dir}/..." if go_dir else " ./..."
            info.test_command = f"go test{dir_arg}"
            info.build_command = f"go build{dir_arg}"
            info.confidence = 0.8
            evidence.append(f"Found go.mod in {go_dir or 'root'}")
            info.evidence = evidence
            return info

        # Check Rust
        cargo_path, rust_dir = find_manifest("Cargo.toml")
        if cargo_path:
            info.language = "RUST"
            info.package_manager = "cargo"
            manifest_arg = f" --manifest-path {rust_dir}/Cargo.toml" if rust_dir else ""
            info.test_command = f"cargo test{manifest_arg}"
            info.build_command = f"cargo build{manifest_arg}"
            info.confidence = 0.8
            evidence.append(f"Found Cargo.toml in {rust_dir or 'root'}")
            info.evidence = evidence
            return info

        # Check standalone HTML / Web app files
        try:
            workspace_files = [f for f in os.listdir(workspace_path) if os.path.isfile(os.path.join(workspace_path, f))]
            html_files = [f for f in workspace_files if f.endswith((".html", ".htm"))]
            if html_files:
                info.language = "HTML"
                info.confidence = 0.7
                evidence.append(f"Found HTML application files: {', '.join(html_files)}")
                info.evidence = evidence
                return info
        except Exception:
            pass

        info.evidence = evidence
        return info
