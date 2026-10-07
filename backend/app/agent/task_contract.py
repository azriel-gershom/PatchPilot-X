from pydantic import BaseModel
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, RepositoryMap, FrameworkInfo

class ContractResponse(BaseModel):
    is_clear: bool
    reason: str
    contract: ChangeContract | None = None

class TaskContractAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm
        
    async def analyze(
        self, 
        request: str, 
        repo_map: RepositoryMap, 
        framework: FrameworkInfo
    ) -> ChangeContract:
        
        system_prompt = (
            "You are an expert Software Architect analyzing a user request. "
            "You must produce a ChangeContract that details exactly what must change and what must be preserved. "
            "If the request is too vague, ambiguous, or unsafe, set is_clear to false and explain why."
        )
        
        prompt = (
            f"User Request: {request}\n\n"
            f"Framework: {framework.language} - {framework.framework}\n"
            f"Repository Map Snippet (Entrypoints/Routes):\n"
            f"Entrypoints: {repo_map.entrypoints}\n"
            f"Routes: {repo_map.api_routes}\n\n"
            "Create the contract."
        )
        
        response = await self.llm.generate_structured(prompt, ContractResponse, system_prompt)
        
        if not response.is_clear or not response.contract:
            raise ValueError(f"Insufficient evidence: {response.reason}")
            
        if not response.contract.must_preserve:
            response.contract.must_preserve.append("Existing core functionality and API contracts")
            
        return response.contract
