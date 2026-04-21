"""Controller layer for web chatbot requests."""

from app.integrations.web.schemas import WebChatRequest, WebChatResponse
from app.llm.llm_service import LLMService

_service = LLMService()


async def handle_chat(request: WebChatRequest) -> WebChatResponse:
    """Process a chat request through the LLM service."""
    answer = await _service.generate_response(request.query)
    return WebChatResponse(response=answer)
