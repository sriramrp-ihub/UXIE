"""Pydantic schemas for LLM request/response payloads."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    session_id: str | None = Field(default=None, description="Optional session identifier")


class ChatResponse(BaseModel):
    answer: str
    in_scope: bool = True
    provider: str = "gemini"
    model: str | None = None
