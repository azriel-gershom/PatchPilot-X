import pytest
from app.agent.validator import BlindValidator, ValidationResult
from app.models.domain import ChangeContract, TestSummary
from app.llm.base import LLMProvider

class MockLLM(LLMProvider):
    def __init__(self, passed: bool, reason: str):
        self.passed = passed
        self.reason = reason
        
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return ""
        
    async def generate_structured(self, prompt: str, schema_model, system_prompt: str = ""):
        return schema_model(passed=self.passed, reason=self.reason, regressions=[])

@pytest.mark.asyncio
async def test_validator_regressions():
    llm = MockLLM(passed=True, reason="")
    validator = BlindValidator(llm)
    
    contract = ChangeContract(goal="", acceptance_criteria=[])
    baseline = TestSummary(passed=10, failed=0, skipped=0, exit_code=0, stdout="", stderr="")
    new_summary = TestSummary(passed=9, failed=1, skipped=0, exit_code=1, stdout="", stderr="")
    
    result = await validator.validate(contract, baseline, new_summary, "")
    assert not result.passed
    assert len(result.regressions) > 0
    assert "Test failures increased" in result.regressions[0]

@pytest.mark.asyncio
async def test_validator_syntax_error():
    llm = MockLLM(passed=True, reason="")
    validator = BlindValidator(llm)
    
    contract = ChangeContract(goal="", acceptance_criteria=[])
    baseline = TestSummary(passed=10, failed=1, skipped=0, exit_code=1, stdout="", stderr="")
    new_summary = TestSummary(passed=10, failed=1, skipped=0, exit_code=1, stdout="", stderr="SyntaxError: invalid syntax")
    
    result = await validator.validate(contract, baseline, new_summary, "")
    assert not result.passed
    assert len(result.regressions) > 0
    assert "Syntax or Reference errors" in result.regressions[0]

@pytest.mark.asyncio
async def test_validator_llm_approval():
    llm = MockLLM(passed=True, reason="Looks good")
    validator = BlindValidator(llm)
    
    contract = ChangeContract(goal="", acceptance_criteria=[])
    baseline = TestSummary(passed=10, failed=0, skipped=0, exit_code=0, stdout="", stderr="")
    new_summary = TestSummary(passed=10, failed=0, skipped=0, exit_code=0, stdout="", stderr="")
    
    result = await validator.validate(contract, baseline, new_summary, "diff")
    assert result.passed
    assert result.reason == "Looks good"

@pytest.mark.asyncio
async def test_validator_llm_rejection():
    llm = MockLLM(passed=False, reason="Missing test case")
    validator = BlindValidator(llm)
    
    contract = ChangeContract(goal="", acceptance_criteria=[])
    baseline = TestSummary(passed=10, failed=0, skipped=0, exit_code=0, stdout="", stderr="")
    new_summary = TestSummary(passed=10, failed=0, skipped=0, exit_code=0, stdout="", stderr="")
    
    result = await validator.validate(contract, baseline, new_summary, "diff")
    assert not result.passed
    assert result.reason == "Missing test case"
