import os
import json
import httpx
from typing import Type, TypeVar, Any
from pydantic import BaseModel, ValidationError
from app.llm.base import LLMProvider, LLMError

T = TypeVar('T', bound=BaseModel)

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-1.5-pro-latest")
        if not self.api_key:
            raise LLMError("Missing GEMINI_API_KEY")

    def _get_url(self) -> str:
        return f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    def _build_payload(self, prompt: str, system_prompt: str = "", response_schema: dict = None):
        if system_prompt:
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "system_instruction": {"parts": [{"text": system_prompt}]}
            }
        else:
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            
        if response_schema:
            payload["generationConfig"] = {
                "responseMimeType": "application/json",
            }
            schema_str = json.dumps(response_schema)
            payload["contents"][0]["parts"].append({
                "text": f"\n\nYou must respond in JSON format matching this schema:\n{schema_str}"
            })
            
        return payload

    async def _make_request(self, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self._get_url(), json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException:
                raise LLMError("Timeout while contacting Gemini API")
            except httpx.HTTPStatusError as e:
                raise LLMError(f"Gemini API HTTP Error: {e.response.text}")
            except Exception as e:
                raise LLMError(f"Unexpected error: {str(e)}")

    def _extract_text(self, data: dict) -> str:
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            raise LLMError(f"Invalid API response format: {json.dumps(data)}")

    async def generate_text(self, prompt: str, system_prompt: str = "") -> str:
        payload = self._build_payload(prompt, system_prompt)
        data = await self._make_request(payload)
        return self._extract_text(data)

    async def generate_structured(self, prompt: str, schema_model: Type[T], system_prompt: str = "") -> T:
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
