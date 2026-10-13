import logging
from typing import List, Type, TypeVar

from app.llm.base import LLMError, LLMProvider
from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

class FallbackLLMProvider(LLMProvider):
    def __init__(self, providers: List[LLMProvider]):
        if not providers:
            raise ValueError("At least one provider must be specified")
        self.providers = providers

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        last_error = None
        for provider in self.providers:
            try:
                result = await provider.generate_text(prompt, system_prompt)
                return result  # Success — return immediately
            except Exception as e:
                logger.warning(f"[Fallback] {provider.__class__.__name__} failed: {type(e).__name__}: {str(e)[:120]}")
                last_error = e
                # Move on to next provider immediately — no retries
        raise LLMError(f"All LLM providers failed. Last error: {last_error}")

    async def generate_structured(
        self, prompt: str, schema_model: Type[T], system_prompt: str = ""
    ) -> T:
        last_error = None
        for provider in self.providers:
            try:
                result = await provider.generate_structured(prompt, schema_model, system_prompt)
                return result  # Success — return immediately
            except Exception as e:
                logger.warning(f"[Fallback] {provider.__class__.__name__} failed: {type(e).__name__}: {str(e)[:120]}")
                last_error = e
                # Move on to next provider immediately — no retries
        raise LLMError(f"All LLM providers failed. Last error: {last_error}")
