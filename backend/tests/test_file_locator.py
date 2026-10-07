import pytest
from app.agent.file_locator import FileLocatorAgent, LocatorResponse
from app.models.domain import ChangeContract, RepositoryMap
from app.llm.base import LLMProvider

class MockLLM(LLMProvider):
    def __init__(self, files_to_return):
        self.files_to_return = files_to_return
        
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return ""
        
    async def generate_structured(self, prompt: str, schema_model, system_prompt: str = ""):
        return schema_model(files=self.files_to_return, reasoning="Mock reasoning")

@pytest.mark.asyncio
async def test_file_locator_success():
    llm = MockLLM(["src/main.py"])
    agent = FileLocatorAgent(llm)
    contract = ChangeContract(goal="test", must_change=[])
    repo_map = RepositoryMap(source_files=["src/main.py", "src/other.py"])
    
    files = await agent.locate_files(contract, repo_map)
    assert files == ["src/main.py"]

@pytest.mark.asyncio
async def test_file_locator_invalid_file():
    llm = MockLLM(["src/nonexistent.py"])
    agent = FileLocatorAgent(llm)
    contract = ChangeContract(goal="test", must_change=[])
    repo_map = RepositoryMap(source_files=["src/main.py"])
    
    with pytest.raises(ValueError, match="LLM selected files not in repository"):
        await agent.locate_files(contract, repo_map)

@pytest.mark.asyncio
async def test_file_locator_no_files():
    llm = MockLLM([])
    agent = FileLocatorAgent(llm)
    contract = ChangeContract(goal="test", must_change=[])
    repo_map = RepositoryMap(source_files=["src/main.py"])
    
    with pytest.raises(ValueError, match="No files were located"):
        await agent.locate_files(contract, repo_map)
