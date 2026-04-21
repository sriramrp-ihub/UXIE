"""Constants for BFSI-focused chatbot behavior."""

BFSI_ALLOWED_TOPICS: tuple[str, ...] = (
    "banking",
    "finance",
    "financial",
    "insurance",
    "fintech",
    "payments",
    "upi",
    "credit",
    "loan",
    "mortgage",
    "risk",
    "compliance",
    "kyc",
    "aml",
    "fraud",
    "regulation",
    "investment",
    "wealth",
    "treasury",
    "capital markets",
)

OUT_OF_SCOPE_MESSAGE = (
    "I can only assist with BFSI topics (banking, financial services, insurance, "
    "risk, compliance, payments, and related areas)."
)

EMPTY_QUERY_MESSAGE = "Please enter a valid BFSI question."
LLM_UNAVAILABLE_MESSAGE = "The assistant is temporarily unavailable. Please try again."
LLM_QUOTA_MESSAGE = "Gemini quota exceeded. Please check API billing/quota and try again shortly."
LLM_CONFIG_MESSAGE = "Gemini API key is missing or invalid. Please update server configuration."
LLM_NETWORK_MESSAGE = "Cannot connect to Gemini right now. Please try again later."

DEFAULT_SYSTEM_INSTRUCTIONS = """
You are a BFSI-focused AI assistant.

Rules:
1. Respond only to BFSI-domain questions.
2. If out of scope, return the configured fallback message.
3. Keep answers concise, factual, and safe.
4. If uncertain, say so and suggest a safe next step.
5. Avoid definitive legal/financial advice.
""".strip()
