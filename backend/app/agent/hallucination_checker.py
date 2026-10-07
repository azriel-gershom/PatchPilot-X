from app.llm.base import LLMProvider
from app.models.domain import HallucinationCheck
from pydantic import BaseModel, Field

class HallucinationResponse(BaseModel):
    hallucination_detected: bool = Field(description="True if invented imports or functions were detected.")
    evidence: list[str] = Field(description="List of reasons or evidence for the decision.")

class HallucinationChecker:
    def __init__(self, llm: LLMProvider):
        self.llm = llm
        
    async def check(self, patch_diff: str, repo_map_str: str) -> HallucinationCheck:
        system_prompt = (
            "You are a strict code reviewer. "
            "Your task is to detect LLM hallucinations in code patches. "
            "A hallucination occurs when the patch introduces imports or calls functions "
            "that do NOT exist in standard libraries or the provided repository context. "
            "Review the diff. Did the author invent any imports or functions? "
        )
        
        prompt = (
            f"Repository Context:\n{repo_map_str}\n\n"
            f"Diff to Review:\n```diff\n{patch_diff}\n```\n\n"
            "Respond with true if there are hallucinations, and provide evidence."
        )
        
        response = await self.llm.generate_structured(prompt, HallucinationResponse, system_prompt)
        
        return HallucinationCheck(
            status="YES" if response.hallucination_detected else "NO",
            evidence=response.evidence
        )
