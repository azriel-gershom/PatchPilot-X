from app.agent.validator import ValidationResult
from app.llm.base import LLMProvider
from app.models.domain import ChangeContract


class ExplainerAgent:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def explain(
        self, contract: ChangeContract, patch_diff: str, validation: ValidationResult
    ) -> str:
        system_prompt = (
            "You are a Technical Writer and Software Engineer. "
            "Write a clear, user-friendly Markdown explanation of what was changed in a codebase, "
            "why it was changed, and how it was validated. "
            "Use the provided ChangeContract, Patch Diff, and ValidationResult."
        )

        prompt = (
            f"Goal: {contract.goal}\n\n"
            f"Patch Diff:\n```diff\n{patch_diff}\n```\n\n"
            f"Validation Status: {'Passed' if validation.passed else 'Failed'}\n"
            f"Validation Reason: {validation.reason}\n\n"
            "Please generate a Markdown formatted summary."
        )

        response = await self.llm.generate_text(prompt, system_prompt)

        return response
