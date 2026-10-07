import abc
from typing import Any, Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMError(Exception):
    pass


class LLMProvider(abc.ABC):
    @abc.abstractmethod
    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        pass

    @abc.abstractmethod
    async def generate_structured(
        self, prompt: str, schema_model: Type[T], system_prompt: str = ""
    ) -> T:
        pass
