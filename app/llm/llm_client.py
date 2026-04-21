"""Gemini API client wrapper.

All provider-specific communication lives here.
"""

from __future__ import annotations

import asyncio
import json
import ssl
from urllib import error, request

import certifi

from app.core.config import get_settings

_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


class LLMClient:
    """Thin HTTP client for Gemini text generation."""

    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.timeout_seconds = settings.gemini_timeout_seconds

    def _call_llm_sync(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_output_tokens: int | None = None,
    ) -> str:
        """Blocking Gemini request implementation used by async wrapper."""
        prompt = (prompt or "").strip()
        if not prompt:
            return ""

        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )

        generation_config: dict[str, float | int] = {"temperature": temperature}
        if max_output_tokens is not None:
            generation_config["maxOutputTokens"] = max_output_tokens

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": generation_config,
        }

        req = request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=self.timeout_seconds, context=_SSL_CONTEXT) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Gemini API HTTP error: {exc.code} {detail}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Gemini API network error: {exc.reason}") from exc
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise RuntimeError("Gemini API returned malformed response") from exc

        candidates = body.get("candidates") or []
        if not candidates:
            return ""

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return ""

        text_fragments = [part.get("text", "") for part in parts if isinstance(part, dict)]
        return "\n".join(fragment.strip() for fragment in text_fragments if fragment).strip()


    async def call_llm(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_output_tokens: int | None = None,
    ) -> str:
        """call_llm(prompt: str) -> str

        Send a prompt to Gemini asynchronously and return plain text.
        """
        return await asyncio.to_thread(
            self._call_llm_sync,
            prompt,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )


async def call_llm(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_output_tokens: int | None = None,
) -> str:
    """Convenience async function signature for lightweight usage."""
    return await LLMClient().call_llm(
        prompt,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
    )
