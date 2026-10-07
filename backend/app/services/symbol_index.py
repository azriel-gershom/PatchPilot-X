import ast
import re


class PythonSymbolExtractor:
    def extract(self, code: str, filepath: str):
        try:
            tree = ast.parse(code, filename=filepath)
        except SyntaxError:
            return {"functions": [], "classes": [], "imports": [], "routes": []}

        functions = []
        classes = []
        imports = []
        routes = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) or isinstance(
                node, ast.AsyncFunctionDef
            ):
                functions.append(node.name)
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call) and isinstance(
                        decorator.func, ast.Attribute
                    ):
                        if decorator.func.attr in [
                            "get",
                            "post",
                            "put",
                            "delete",
                            "patch",
                        ]:
                            if decorator.args and isinstance(
                                decorator.args[0], ast.Constant
                            ):
                                routes.append(
                                    f"{decorator.func.attr.upper()} {decorator.args[0].value}"
                                )
            elif isinstance(node, ast.ClassDef):
                classes.append(node.name)
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    imports.append(f"{module}.{alias.name}")

        return {
            "functions": functions,
            "classes": classes,
            "imports": imports,
            "routes": routes,
        }


class JavascriptSymbolExtractor:
    def extract(self, code: str):
        functions = re.findall(
            r"(?:function|const|let|var)\s+([\w\$]+)\s*(?:=|)\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))",
            code,
        )
        functions += re.findall(r"function\s+([\w\$]+)\s*\(", code)

        classes = re.findall(r"class\s+([\w\$]+)", code)
        imports = re.findall(r"import\s+.*?\s+from\s+['\"](.*?)['\"]", code)

        return {
            "functions": list(set(functions)),
            "classes": list(set(classes)),
            "imports": list(set(imports)),
            "routes": [],
        }


def extract_symbols(filepath: str, code: str):
    if filepath.endswith(".py"):
        return PythonSymbolExtractor().extract(code, filepath)
    elif filepath.endswith((".js", ".jsx", ".ts", ".tsx")):
        return JavascriptSymbolExtractor().extract(code)
    return {"functions": [], "classes": [], "imports": [], "routes": []}
