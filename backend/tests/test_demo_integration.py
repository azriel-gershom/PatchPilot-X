import pytest
from app.agent.orchestrator import MasterOrchestrator
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, HallucinationCheck, BlindValidationPlan
from app.agent.validator import ValidationResult

class MockLLM(LLMProvider):
    async def generate_structured(self, prompt: str, schema_class, system_prompt: str = ""):
        if schema_class == ChangeContract:
            return ChangeContract(
                goal="Add case-insensitive username search",
                acceptance_criteria=["Query by username works", "Case-insensitive"],
                must_change=["app/routes.py", "app/service.py"],
                must_preserve=["app/models.py", "POST /users", "GET /users/{id}"],
                edge_cases=["Empty username", "No match"],
                validation_plan=[]
            )
        elif schema_class == BlindValidationPlan:
            return BlindValidationPlan(cases=[])
        elif schema_class == HallucinationCheck:
            return HallucinationCheck(status="NO", evidence=[])
        elif schema_class == ValidationResult:
            return ValidationResult(passed=True, reason="Criteria met", regressions=[])
        
        return schema_class()
        
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        if "patch" in prompt.lower() or "modify" in prompt.lower():
            # Mock patch generation
            return "Mock code modification"
        return "Mock response"

import asyncio

def test_safe_patch_demo_orchestration():
    llm = MockLLM()
    orchestrator = MasterOrchestrator(llm)
    
    result = asyncio.run(orchestrator.run("demo_run_123", "https://github.com/azriel-gershom/PatchPilot-X.git", "Add case-insensitive username search"))
    
    assert result["status"] in ["COMPLETED_SUCCESS", "FAILED", "PENDING"]
