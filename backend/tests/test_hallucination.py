import pytest
from app.agent.hallucination_checker import HallucinationChecker, HallucinationResponse
from app.llm.base import LLMProvider

class MockLLM(LLMProvider):
    def __init__(self, detected: bool):
        self.detected = detected
        
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return ""
        
    async def generate_structured(self, prompt: str, schema_model, system_prompt: str = ""):
        return schema_model(hallucination_detected=self.detected, evidence=["mock evidence"])

@pytest.mark.asyncio
async def test_hallucination_checker_yes():
    llm = MockLLM(True)
    checker = HallucinationChecker(llm)
    res = await checker.check("diff", "repo_map")
    assert res.status == "YES"
    assert res.evidence == ["mock evidence"]

@pytest.mark.asyncio
async def test_hallucination_checker_no():
    llm = MockLLM(False)
    checker = HallucinationChecker(llm)
    res = await checker.check("diff", "repo_map")
    assert res.status == "NO"
