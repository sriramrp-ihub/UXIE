"""Central chatbot router adapter.

Keeps API exposure under app/routes while implementation remains in integrations.
"""

from app.integrations.web.routes import router

__all__ = ["router"]
