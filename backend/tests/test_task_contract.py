import pytest
from app.agent.task_contract import ContractResponse, TaskContractAgent
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, FrameworkInfo, RepositoryMap


class MockLLM(LLMProvider):
    def __init__(self, is_clear=True):
        self.is_clear = is_clear

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return ""

    async def generate_structured(
        self, prompt: str, schema_model, system_prompt: str = ""
    ):
        if self.is_clear:
            contract = ChangeContract(
                goal="Add search",
                acceptance_criteria=["Search works"],
                must_change=["user search logic"],
                must_preserve=["GET user by ID"],
                edge_cases=[],
                validation_plan=[],
            )
            return schema_model(is_clear=True, reason="", contract=contract)
        else:
            return schema_model(is_clear=False, reason="Too vague", contract=None)


@pytest.mark.asyncio
async def test_task_contract_success():
    llm = MockLLM(is_clear=True)
    agent = TaskContractAgent(llm)
    repo_map = RepositoryMap()
    framework = FrameworkInfo(language="PYTHON", confidence=1.0)

    contract = await agent.analyze("Add search", repo_map, framework)
    assert contract.goal == "Add search"
    assert "GET user by ID" in contract.must_preserve


@pytest.mark.asyncio
async def test_task_contract_insufficient_evidence():
    llm = MockLLM(is_clear=False)
    agent = TaskContractAgent(llm)
    repo_map = RepositoryMap()
    framework = FrameworkInfo(language="PYTHON", confidence=1.0)

    with pytest.raises(ValueError, match="Insufficient evidence"):
        await agent.analyze("do stuff", repo_map, framework)
