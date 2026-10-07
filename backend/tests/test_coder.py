import pytest
from app.agent.coder import CoderAgent, FileModification
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract


class MockLLM(LLMProvider):
    def __init__(self, code_to_return):
        self.code_to_return = code_to_return

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return ""

    async def generate_structured(
        self, prompt: str, schema_model, system_prompt: str = ""
    ):
        return schema_model(file_path="src/main.py", new_content=self.code_to_return)


@pytest.mark.asyncio
async def test_coder_success():
    valid_code = "def foo():\n    return True\n"
    llm = MockLLM(valid_code)
    agent = CoderAgent(llm)
    contract = ChangeContract(goal="test", must_change=[], must_preserve=[])

    new_code = await agent.modify_file(
        contract, "src/main.py", "def foo():\n    pass\n"
    )
    assert new_code == valid_code


@pytest.mark.asyncio
async def test_coder_syntax_error():
    invalid_code = "def foo()  pass"
    llm = MockLLM(invalid_code)
    agent = CoderAgent(llm)
    contract = ChangeContract(goal="test", must_change=[], must_preserve=[])

    with pytest.raises(ValueError, match="syntax errors"):
        await agent.modify_file(contract, "src/main.py", "def foo():\n    pass\n")
