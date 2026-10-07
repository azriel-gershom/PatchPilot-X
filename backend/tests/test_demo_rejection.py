import pytest
import asyncio
from app.agent.orchestrator import MasterOrchestrator
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract, HallucinationCheck, BlindValidationPlan
from app.agent.validator import ValidationResult, TestSummary

class MockRejectionLLM(LLMProvider):
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
            # We mock the validator to return a rejected state due to regressions
            return ValidationResult(
                passed=False, 
                reason="test_get_user_by_id failed. Classification: NEW_REGRESSION", 
                regressions=["test_get_user_by_id"]
            )
        
        return schema_class()
        
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        return "Mock unsafe modification"

def test_regression_rejection_demo_orchestration():
    llm = MockRejectionLLM()
    orchestrator = MasterOrchestrator(llm)
    
    result = asyncio.run(orchestrator.run("demo_run_rejection", "https://github.com/azriel-gershom/PatchPilot-X.git", "Add case-insensitive username search"))
    
    # In an unsafe patch scenario, validation should fail, leaving it in FAILED or completing but with a rejected patch
    # The actual master orchestrator sets COMPLETED_SUCCESS if the patch was accepted, or FAILED if it was ultimately rejected and couldn't be repaired.
    # We assert that the status ends up as FAILED because the patch was rejected and couldn't be repaired (no mocked repair loop success).
    assert result["status"] == "FAILED"
