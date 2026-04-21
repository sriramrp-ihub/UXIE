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
    tone = str(logic.get("tone", "educational"))

    output_instruction = (
        "Output contract:\n"
        f"- Intent context: {intent}\n"
        f"- Tone: {tone}\n"
        f"- Format: {response_format}\n"
        "- Keep answer concise, practical, and avoid absolute guarantees.\n"
    )

    if response_format == "steps":
        output_instruction += "- Return a numbered step-by-step answer.\n"
    elif response_format == "comparison":
        output_instruction += "- Return a side-by-side comparison with key differences.\n"
    else:
        output_instruction += "- Return a direct plain-language explanation.\n"

    return (
        f"{DEFAULT_SYSTEM_INSTRUCTIONS}\n\n"
        f"{output_instruction}\n"
        f"Out-of-scope fallback: {OUT_OF_SCOPE_MESSAGE}\n\n"
        f"User Question: {cleaned}"
    )
