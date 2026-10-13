from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, FrameworkInfo, RepositoryMap
from pydantic import BaseModel


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
        framework: FrameworkInfo,
        baseline_summary: any = None,
    ) -> ChangeContract:
        system_prompt = (
            "You are an expert Software Architect analyzing a user request. "
            "You must produce a ChangeContract that details exactly what must change and what must be preserved. "
            "If the request is too vague, ambiguous, or unsafe, set is_clear to false and explain why."
        )

        symbols_info = ""
        if repo_map.classes:
            symbols_info += f"Discovered Classes: {repo_map.classes[:10]}\n"
        if repo_map.functions:
            symbols_info += f"Discovered Functions: {repo_map.functions[:15]}\n"

        test_info = ""
        if baseline_summary:
            test_info = f"Baseline Test Suite: {getattr(baseline_summary, 'passed', 0)} passed, {getattr(baseline_summary, 'failed', 0)} failed.\n"
            if getattr(baseline_summary, 'failed', 0) > 0 and getattr(baseline_summary, 'stdout', None):
                test_info += f"Test Failure Output Snippet:\n{baseline_summary.stdout[-400:]}\n"

        prompt = (
            f"User Request: {request}\n\n"
            f"Framework: {framework.language} - {framework.framework}\n"
            f"Source Files: {repo_map.source_files[:20]}\n"
            f"{symbols_info}"
            f"{test_info}"
            f"Repository Map Snippet (Entrypoints/Routes):\n"
            f"Entrypoints: {repo_map.entrypoints}\n"
            f"Routes: {repo_map.api_routes}\n\n"
            "Create the contract."
        )

        response = await self.llm.generate_structured(
            prompt, ContractResponse, system_prompt
        )

        if not response.is_clear or not response.contract:
            raise ValueError(f"Insufficient evidence: {response.reason}")

        if not response.contract.must_preserve:
            response.contract.must_preserve.append(
                "Existing core functionality and API contracts"
            )

        return response.contract
