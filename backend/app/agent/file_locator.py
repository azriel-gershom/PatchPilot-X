from pydantic import BaseModel, Field
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, RepositoryMap

class LocatorResponse(BaseModel):
    files: list[str] = Field(description="List of file paths that need to be modified")
    reasoning: str = Field(description="Explanation of why these files were selected")

class FileLocatorAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm
        
    async def locate_files(
        self, 
        contract: ChangeContract, 
        repo_map: RepositoryMap
    ) -> list[str]:
        
        system_prompt = (
            "You are a Senior Software Engineer. Your task is to identify exactly which files "
            "need to be modified to fulfill the given ChangeContract."
            "Only select files that exist in the provided Repository Map. "
            "Select the absolute minimal set of files required."
        )
        
        prompt = (
            f"Change Contract Goal: {contract.goal}\n"
            f"Must Change: {contract.must_change}\n\n"
            f"Repository Files:\n"
            f"Source Files: {repo_map.source_files}\n"
            f"Config Files: {repo_map.config_files}\n"
            f"Functions: {repo_map.functions}\n"
            f"Classes: {repo_map.classes}\n\n"
            "Return the list of exact file paths to modify."
        )
        
        response = await self.llm.generate_structured(prompt, LocatorResponse, system_prompt)
        
        selected_files = response.files
        
        valid_files = repo_map.source_files + repo_map.config_files + repo_map.dependency_manifests + repo_map.test_files
        
        invalid = [f for f in selected_files if f not in valid_files]
        if invalid:
            raise ValueError(f"LLM selected files not in repository: {invalid}")
            
        if not selected_files:
            raise ValueError("No files were located to fulfill the contract.")
            
        return selected_files
