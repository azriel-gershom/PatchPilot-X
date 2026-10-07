from app.models.domain import RunStatus, RepositoryInfo, TestSummary

def test_run_status():
    assert RunStatus.CREATED.value == "CREATED"
    assert RunStatus.PATCHING.value == "PATCHING"

def test_repository_info_validation():
    repo = RepositoryInfo(url="https://github.com/a/b.git", branch="main")
    assert repo.url == "https://github.com/a/b.git"
    assert repo.commit_sha is None

def test_test_summary_validation():
    summary = TestSummary(passed=10, failed=0, skipped=1, exit_code=0, stdout="pass", stderr="")
    assert summary.passed == 10
    
    try:
        TestSummary(passed="not an int", failed=0, skipped=0, exit_code=0, stdout="", stderr="")
        assert False, "Should have raised validation error"
    except Exception:
        pass
