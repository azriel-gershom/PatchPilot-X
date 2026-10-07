import difflib


def generate_unified_diff(
    original_code: str, modified_code: str, file_path: str
) -> str:
    """
    Generates a unified diff string between original_code and modified_code.
    Uses Python's difflib.unified_diff.
    """
    if original_code == modified_code:
        return ""

    original_lines = original_code.splitlines(keepends=True)
    modified_lines = modified_code.splitlines(keepends=True)

    if original_lines and not original_lines[-1].endswith("\n"):
        original_lines[-1] += "\n\\ No newline at end of file\n"
    if modified_lines and not modified_lines[-1].endswith("\n"):
        modified_lines[-1] += "\n\\ No newline at end of file\n"

    diff = difflib.unified_diff(
        original_lines,
        modified_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        n=3,
    )

    return "".join(diff)
