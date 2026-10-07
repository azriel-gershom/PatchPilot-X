from app.sandbox.diff_utils import generate_unified_diff


def test_generate_unified_diff():
    original = "def foo():\n    pass\n"
    modified = "def foo():\n    return True\n"

    diff = generate_unified_diff(original, modified, "src/main.py")

    assert "--- a/src/main.py" in diff
    assert "+++ b/src/main.py" in diff
    assert "-    pass" in diff
    assert "+    return True" in diff


def test_generate_unified_diff_no_changes():
    original = "def foo():\n    pass\n"
    modified = "def foo():\n    pass\n"

    diff = generate_unified_diff(original, modified, "src/main.py")
    assert diff == ""


def test_generate_unified_diff_no_newline():
    original = "def foo():\n    pass"
    modified = "def foo():\n    return True"

    diff = generate_unified_diff(original, modified, "src/main.py")
    assert "\\ No newline at end of file" in diff
