import json
import os
from typing import Any, Type, TypeVar

import httpx
from app.llm.base import LLMError, LLMProvider
from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


class GroqProvider(LLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        if not self.api_key:
            raise LLMError("Missing GROQ_API_KEY")

    def _get_url(self) -> str:
        return "https://api.groq.com/openai/v1/chat/completions"

    def _build_payload(
        self, prompt: str, system_prompt: str = "", response_schema: dict = None
    ):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
            
        if response_schema:
            schema_str = json.dumps(response_schema)
            prompt += f"\n\nYou must respond in JSON format exactly matching this schema:\n{schema_str}"

        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
        }

        if response_schema:
            payload["response_format"] = {"type": "json_object"}

        return payload

    async def _make_request(self, payload: dict) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            max_retries = 4
            for attempt in range(max_retries):
                try:
                    response = await client.post(self._get_url(), headers=headers, json=payload)
                    if response.status_code in [429, 503] and attempt < max_retries - 1:
                        import asyncio, re
                        match = re.search(r"try again in ([\d\.]+)s", response.text)
                        wait_seconds = float(match.group(1)) + 1.0 if match else (attempt + 1) * 4.0
                        wait_seconds = min(wait_seconds, 15.0)
                        await asyncio.sleep(wait_seconds)
                        continue
                    response.raise_for_status()
                    return response.json()
                except httpx.TimeoutException:
                    raise LLMError("Timeout while contacting Groq API")
                except httpx.HTTPStatusError as e:
                    if e.response.status_code in [429, 503] and attempt < max_retries - 1:
                        import asyncio
                        await asyncio.sleep(5.0)
                        continue
                    raise LLMError(f"Groq API HTTP Error: {e.response.text}")
                except LLMError:
                    raise
                except Exception as e:
                    raise LLMError(f"Unexpected error: {str(e)}")

    def _extract_text(self, data: dict) -> str:
        try:
            text = data["choices"][0]["message"]["content"]
            # Strip Qwen/reasoning model <think>...</think> tokens
            import re
            text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
            return text
        except (KeyError, IndexError):
            raise LLMError(f"Invalid API response format: {json.dumps(data)}")

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        payload = self._build_payload(prompt, system_prompt)
        data = await self._make_request(payload)
        return self._extract_text(data)

    async def generate_structured(
        self, prompt: str, schema_model: Type[T], system_prompt: str = ""
    ) -> T:
        schema = schema_model.model_json_schema()
        payload = self._build_payload(prompt, system_prompt, response_schema=schema)
        data = await self._make_request(payload)
        text_resp = self._extract_text(data)

        text_resp = text_resp.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.startswith("```"):
            text_resp = text_resp[3:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
        text_resp = text_resp.strip()

        try:
            parsed = json.loads(text_resp)
            return schema_model(**parsed)
        except json.JSONDecodeError:
            raise LLMError("Invalid JSON returned by LLM")
        except ValidationError as e:
            raise LLMError(f"Invalid schema: {e}")
