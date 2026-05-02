"""Prompt construction for BFSI chatbot."""

from app.llm.constants import DEFAULT_SYSTEM_INSTRUCTIONS, OUT_OF_SCOPE_MESSAGE
from app.llm.utils import normalize_text, truncate_text


def build_prompt(query: str, logic: dict[str, str | bool]) -> str:
    """build_prompt(query: str, logic: dict[str, str | bool]) -> str

    Build a final model prompt with system constraints and user text.
    """
    cleaned = truncate_text(normalize_text(query), max_chars=2000)
    intent = str(logic.get("intent", "general"))
    response_format = str(logic.get("format", "simple"))

    extra_instruction = ""
    if intent == "comparison":
        extra_instruction = "Compare the items side by side and highlight key differences."
    elif response_format == "steps":
        extra_instruction = "Explain the answer in numbered steps or bullets if that makes it clearer."
    elif intent == "definition":
        extra_instruction = "Give a simple educational definition first, then add a short explanation if useful."
    elif intent == "calculation":
        extra_instruction = "Provide the calculation clearly and keep any explanation brief."
    else:
        extra_instruction = "Answer naturally in a clear, educational way."

    return (
        f"{DEFAULT_SYSTEM_INSTRUCTIONS}\n\n"
        f"{extra_instruction}\n"
        f"Out-of-scope fallback: {OUT_OF_SCOPE_MESSAGE}\n\n"
        f"User Question: {cleaned}"
    )
