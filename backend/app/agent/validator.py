from pydantic import BaseModel, Field
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, TestSummary

class ValidationResult(BaseModel):
    passed: bool
    reason: str
    regressions: list[str] = Field(default_factory=list)

class BlindValidator:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def validate(
        self, 
        contract: ChangeContract, 
        baseline: TestSummary, 
        new_summary: TestSummary,
        file_diffs: str
    ) -> ValidationResult:
        
        regressions = []
        if new_summary.failed > baseline.failed:
            regressions.append(f"Test failures increased from {baseline.failed} to {new_summary.failed}.")
            
        if baseline.exit_code == 0 and new_summary.exit_code != 0:
            regressions.append("Test suite exit code changed from 0 to non-zero.")
            
        if "SyntaxError" in new_summary.stderr or "ReferenceError" in new_summary.stderr:
            regressions.append("Syntax or Reference errors detected in stderr.")

        if regressions:
            return ValidationResult(
                passed=False,
                reason="Regressions or compile errors detected.",
                regressions=regressions
            )
            
        system_prompt = (
            "You are a strict QA Engineer. "
            "Evaluate if the acceptance criteria in the ChangeContract are met based on the "
            "provided test output and file diffs. If the diffs and tests show the feature was "
            "implemented correctly, return passed=True. Otherwise, passed=False."
        )
        
        prompt = (
            f"Acceptance Criteria: {contract.acceptance_criteria}\n\n"
            f"File Diffs:\n{file_diffs}\n\n"
            f"Test Output (stdout):\n{new_summary.stdout}\n\n"
            f"Test Output (stderr):\n{new_summary.stderr}\n\n"
            "Did this change meet the acceptance criteria?"
        )
        
        llm_response = await self.llm.generate_structured(prompt, ValidationResult, system_prompt)
        
        return llm_response
