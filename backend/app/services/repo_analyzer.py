import os

from app.models.domain import RepositoryMap
from app.services.symbol_index import extract_symbols

IGNORED_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    "venv",
    ".venv",
    "__pycache__",
    ".pytest_cache",
}
BINARY_EXTENSIONS = {
    ".jpg",
    ".png",
    ".pdf",
    ".pyc",
    ".whl",
    ".exe",
    ".dll",
    ".zip",
    ".tar",
    ".gz",
}
TEST_PATTERNS = ["test_", "_test", "spec.", ".test."]


class RepoAnalyzer:
    def build_map(self, workspace_path: str) -> RepositoryMap:
        repo_map = RepositoryMap()

        for root, dirs, files in os.walk(workspace_path):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in BINARY_EXTENSIONS:
                    continue

                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, workspace_path)

                if ext in [
                    ".py",
                    ".js",
                    ".jsx",
                    ".ts",
                    ".tsx",
                    ".java",
                    ".go",
                    ".rs",
                    ".cpp",
                    ".c",
                    ".h",
                ]:
                    lang_ext = ext[1:]
                    if lang_ext not in repo_map.languages:
                        repo_map.languages.append(lang_ext)

                is_test = any(p in file for p in TEST_PATTERNS)
                if file in [
                    "package.json",
                    "requirements.txt",
                    "pyproject.toml",
                    "pom.xml",
                    "build.gradle",
                    "go.mod",
                    "Cargo.toml",
                ]:
                    repo_map.dependency_manifests.append(rel_path)
                elif is_test:
                    repo_map.test_files.append(rel_path)
                elif ext in [
                    ".py",
                    ".js",
                    ".jsx",
                    ".ts",
                    ".tsx",
                    ".java",
                    ".go",
                    ".rs",
                    ".cpp",
                    ".c",
                    ".h",
                ]:
                    repo_map.source_files.append(rel_path)
                else:
                    repo_map.config_files.append(rel_path)

                if file in ["main.py", "app.py", "index.js", "index.ts", "server.js"]:
                    repo_map.entrypoints.append(rel_path)

                if ext in [".py", ".js", ".jsx", ".ts", ".tsx"]:
                    try:
                        with open(full_path, "r", encoding="utf-8") as f:
                            code = f.read()

                        symbols = extract_symbols(full_path, code)
                        if symbols["functions"]:
                            repo_map.functions.extend(symbols["functions"])
                        if symbols["classes"]:
                            repo_map.classes.extend(symbols["classes"])
                        if symbols["imports"]:
                            repo_map.imports.extend(symbols["imports"])
                        if symbols["routes"]:
                            repo_map.api_routes.extend(symbols["routes"])

                    except Exception:
                        pass

        repo_map.languages = list(set(repo_map.languages))
        repo_map.functions = list(set(repo_map.functions))
        repo_map.classes = list(set(repo_map.classes))
        repo_map.imports = list(set(repo_map.imports))
        repo_map.api_routes = list(set(repo_map.api_routes))

        return repo_map
