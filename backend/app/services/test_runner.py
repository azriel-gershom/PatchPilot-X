import re

from app.core.storage import save_artifact
from app.models.domain import FrameworkInfo, TestSummary
from app.sandbox.executor import CommandExecutor


class TestRunner:
    def __init__(self, executor: CommandExecutor = None):
        self.executor = executor or CommandExecutor()

    def run_tests(
        self, workspace_path: str, framework_info: FrameworkInfo, run_id: str = None
    ) -> TestSummary:
        if not framework_info.test_command:
            summary = TestSummary(
                passed=0,
                failed=0,
                skipped=0,
                exit_code=0,
                stdout="No test command found",
                stderr="",
            )
            if run_id:
                save_artifact(run_id, "baseline", summary)
            return summary

        execution = self.executor.execute(framework_info.test_command, workspace_path)

        passed, failed, skipped = self.parse_test_output(
            execution.stdout + "\n" + execution.stderr, framework_info.test_command
        )

        summary = TestSummary(
            passed=passed,
            failed=failed,
            skipped=skipped,
            exit_code=execution.exit_code,
            stdout=execution.stdout,
            stderr=execution.stderr,
        )

        if run_id:
            save_artifact(run_id, "baseline", summary)

        return summary

    def parse_test_output(self, output: str, command: str) -> tuple[int, int, int]:
        passed = 0
        failed = 0
        skipped = 0

        if "pytest" in command:
            match = re.search(r"==+(.*?)==+", output)
            if match:
                summary_line = match.group(1).lower()
                passed_match = re.search(r"(\d+)\s+passed", summary_line)
                failed_match = re.search(r"(\d+)\s+failed", summary_line)
                skipped_match = re.search(r"(\d+)\s+skipped", summary_line)
                if passed_match:
                    passed = int(passed_match.group(1))
                if failed_match:
                    failed = int(failed_match.group(1))
                if skipped_match:
                    skipped = int(skipped_match.group(1))
        elif "npm" in command or "jest" in command or "vitest" in command:
            match = re.search(r"Tests:\s*(.*?total)", output)
            if match:
                summary_line = match.group(1).lower()
                passed_match = re.search(r"(\d+)\s+passed", summary_line)
                failed_match = re.search(r"(\d+)\s+failed", summary_line)
                skipped_match = re.search(r"(\d+)\s+skipped", summary_line)
                if passed_match:
                    passed = int(passed_match.group(1))
                if failed_match:
                    failed = int(failed_match.group(1))
                if skipped_match:
                    skipped = int(skipped_match.group(1))

        return passed, failed, skipped
