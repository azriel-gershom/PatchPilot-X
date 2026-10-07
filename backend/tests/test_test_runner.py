import pytest
from app.models.domain import FrameworkInfo
from app.sandbox.executor import CommandExecutor
from app.services.test_runner import TestRunner


class MockExecutor(CommandExecutor):
    def __init__(self, stdout_mock: str, exit_code_mock: int):
        super().__init__()
        self.stdout_mock = stdout_mock
        self.exit_code_mock = exit_code_mock

    def execute(self, command: str, cwd: str):
        from app.models.domain import TestExecution

        return TestExecution(
            command=command,
            cwd=cwd,
            started_at="",
            duration=1.0,
            exit_code=self.exit_code_mock,
            stdout=self.stdout_mock,
            stderr="",
            timed_out=False,
        )


def test_pytest_parsing():
    out = "==== 1 failed, 2 passed, 1 skipped in 0.12s ===="
    runner = TestRunner(executor=MockExecutor(out, 1))
    finfo = FrameworkInfo(language="PYTHON", test_command="pytest", confidence=1.0)

    summary = runner.run_tests("/tmp", finfo)
    assert summary.passed == 2
    assert summary.failed == 1
    assert summary.skipped == 1
    assert summary.exit_code == 1


def test_jest_parsing():
    out = "Tests:       2 failed, 5 passed, 7 total"
    runner = TestRunner(executor=MockExecutor(out, 1))
    finfo = FrameworkInfo(
        language="JAVASCRIPT", test_command="npm test", confidence=1.0
    )

    summary = runner.run_tests("/tmp", finfo)
    assert summary.passed == 5
    assert summary.failed == 2
    assert summary.skipped == 0
    assert summary.exit_code == 1


def test_no_test_command():
    runner = TestRunner()
    finfo = FrameworkInfo(language="PYTHON", test_command=None, confidence=1.0)

    summary = runner.run_tests("/tmp", finfo)
    assert summary.passed == 0
    assert summary.exit_code == 0
    assert summary.stdout == "No test command found"
