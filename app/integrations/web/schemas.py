"""Web integration schemas for /chat API."""

from pydantic import BaseModel, Field


class WebChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)


class WebChatResponse(BaseModel):
    response: str
