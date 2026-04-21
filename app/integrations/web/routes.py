"""FastAPI routes for chatbot web interface."""

from fastapi import APIRouter

from app.integrations.web.controller import handle_chat
from app.integrations.web.schemas import WebChatRequest, WebChatResponse

router = APIRouter(tags=["chatbot"])


@router.post("/chat")
async def chat(payload: WebChatRequest) -> WebChatResponse:
    return await handle_chat(payload)
