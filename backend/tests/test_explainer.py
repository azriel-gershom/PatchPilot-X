import pytest
from app.agent.explainer import ExplainerAgent
from app.models.domain import ChangeContract
from app.agent.validator import ValidationResult
from app.llm.base import LLMProvider

class MockLLM(LLMProvider):
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return "# Explanation\nAll good."
        
    async def generate_structured(self, prompt: str, schema_model, system_prompt: str = ""):
        return None

@pytest.mark.asyncio
async def test_explainer():
    llm = MockLLM()
    agent = ExplainerAgent(llm)
    contract = ChangeContract(goal="", acceptance_criteria=[])
    validation = ValidationResult(passed=True, reason="")
    
    res = await agent.explain(contract, "diff", validation)
    assert "# Explanation" in res
