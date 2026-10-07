from unittest.mock import MagicMock, patch

import pytest
from app.llm.base import LLMError
from app.llm.gemini import GeminiProvider
from pydantic import BaseModel


class DummyModel(BaseModel):
    name: str
    score: int


def test_missing_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(LLMError, match="Missing GEMINI_API_KEY"):
        GeminiProvider(api_key="")


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_generate_text_success(mock_post):
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Hello world"}]}}]
    }
    mock_post.return_value = mock_resp

    provider = GeminiProvider(api_key="test")
    res = await provider.generate_text("Say hello")
    assert res == "Hello world"


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_generate_structured_success(mock_post):
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": '```json\n{"name": "AI", "score": 100}\n```'}]
                }
            }
        ]
    }
    mock_post.return_value = mock_resp

    provider = GeminiProvider(api_key="test")
    res = await provider.generate_structured("Get stats", DummyModel)
    assert isinstance(res, DummyModel)
    assert res.name == "AI"
    assert res.score == 100


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
async def test_generate_structured_invalid_json(mock_post):
    mock_resp = MagicMock()
    mock_resp.raise_for_status.return_value = None
    mock_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "not json"}]}}]
    }
    mock_post.return_value = mock_resp

    provider = GeminiProvider(api_key="test")
    with pytest.raises(LLMError, match="Invalid JSON"):
        await provider.generate_structured("Get stats", DummyModel)
