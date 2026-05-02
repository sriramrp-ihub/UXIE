"""Finance logic layer for input understanding and output control.

This module is intentionally deterministic and lightweight so it can run before
and after LLM calls with low latency.
"""

from __future__ import annotations

import re

from app.llm.utils import normalize_text, truncate_text

FinanceLogic = dict[str, str | bool]

_UNSAFE_REPLACEMENTS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"\bguaranteed\s+return(s)?\b", flags=re.IGNORECASE),
        "potential returns subject to market risk",
    ),
    (
        re.compile(r"\brisk[-\s]*free\s+profit(s)?\b", flags=re.IGNORECASE),
        "returns can vary and include risk",
    ),
    (
        re.compile(r"\bno\s+risk\b", flags=re.IGNORECASE),
        "risk levels can differ based on product and market conditions",
    ),
)

_DISCLAIMER_BY_INTENT: dict[str, str] = {
    "investment": "For personalised advice, please consult a certified financial advisor or your bank directly.",
    "lending": "Note: Loan terms, rates, and eligibility vary by lender and borrower profile.",
    "insurance": "Note: Coverage, exclusions, and claim outcomes depend on policy wording and underwriting.",
    "calculation": "Note: This is an illustrative estimate, not financial advice.",
}


def detect_finance_intent(query: str) -> str:
    """Classify query into a finance intent bucket.

    Returns one of:
    - investment, lending, insurance, definition, comparison, calculation, general
    """
    text = normalize_text(query).lower()
    if not text:
        return "general"

    if any(k in text for k in ("calculate", "compute", "emi", "interest", "%", " plus ", " minus ", " x ", " / ")) and any(
        ch.isdigit() for ch in text
    ):
        return "calculation"

    if any(k in text for k in ("difference", "compare", "vs", "versus", "better than")):
        return "comparison"

    if any(k in text for k in ("what is", "define", "meaning of", "explain")):
        return "definition"

    if any(k in text for k in ("mutual fund", "sip", "stock", "equity", "bond", "portfolio", "invest")):
        return "investment"

    if any(k in text for k in ("loan", "emi", "interest rate", "credit score", "mortgage", "borrow")):
        return "lending"

    if any(k in text for k in ("insurance", "premium", "claim", "coverage", "policy")):
        return "insurance"

    return "general"


def apply_finance_input_logic(query: str) -> FinanceLogic:
    """Build a control object used by prompting and output post-processing."""
    intent = detect_finance_intent(query)

    format_by_intent = {
        "comparison": "comparison",
        "calculation": "simple",
        "investment": "steps",
        "lending": "steps",
        "insurance": "steps",
    }

    tone_by_intent = {
        "comparison": "analytical",
        "calculation": "educational",
        "definition": "educational",
    }

    return {
        "intent": intent,
        "format": format_by_intent.get(intent, "simple"),
        "tone": tone_by_intent.get(intent, "educational"),
        "needs_calculation": intent == "calculation",
    }


def _sanitize_unsafe_claims(response: str) -> str:
    text = response
    for pattern, replacement in _UNSAFE_REPLACEMENTS:
        text = pattern.sub(replacement, text)
    return text


def _ensure_educational_tone(response: str) -> str:
    return response


def _format_as_steps(text: str) -> str:
    lines = [line.strip(" -•") for line in text.splitlines() if line.strip()]
    if not lines:
        return text
    if any(re.match(r"^\d+[\).\-]\s", line) for line in lines):
        return "\n".join(lines)
    if len(lines) == 1:
        sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", lines[0]) if part.strip()]
    else:
        sentences = lines
    steps = [f"{idx}. {sentence}" for idx, sentence in enumerate(sentences[:8], start=1)]
    return "\n".join(steps)


def _format_as_comparison(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if any("|" in line for line in lines):
        return "\n".join(lines)
    if len(lines) >= 2:
        return "\n".join(["Comparison:"] + [f"- {line}" for line in lines[:6]])
    parts = [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]
    return "\n".join(["Comparison:"] + [f"- {part}" for part in parts[:4]])


def _apply_format(text: str, format_type: str) -> str:
    if format_type == "steps":
        return _format_as_steps(text)
    if format_type == "comparison":
        return _format_as_comparison(text)
    return text


def _append_disclaimer_if_needed(text: str, intent: str) -> str:
    disclaimer = _DISCLAIMER_BY_INTENT.get(intent)
    if not disclaimer:
        return text
    if disclaimer.lower() in text.lower():
        return text
    return f"{text}\n\n{disclaimer}"


def apply_finance_output_logic(response: str, logic: FinanceLogic) -> str:
    """Apply post-LLM finance-safe output transformations."""
    text = truncate_text(normalize_text(response), max_chars=3000)
    if not text:
        return "I could not generate a reliable finance response. Please rephrase your question."

    text = _sanitize_unsafe_claims(text)

    if logic.get("tone") == "educational":
        text = _ensure_educational_tone(text)

    text = _apply_format(text, str(logic.get("format", "simple")))
    text = _append_disclaimer_if_needed(text, str(logic.get("intent", "general")))
    return truncate_text(text, max_chars=3200)


def try_compute_finance_calculation(query: str) -> str | None:
    """Return a deterministic placeholder calculation result when possible.

    Supported patterns:
    - addition/subtraction/multiplication/division over first two numbers
    - percentage of amount, e.g. "10% of 50000"
    """
    text = normalize_text(query).lower()
    numbers = [float(value) for value in re.findall(r"-?\d+(?:\.\d+)?", text)]

    percent_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s+of\s+(\d+(?:\.\d+)?)", text)
    if percent_match:
        rate = float(percent_match.group(1))
        amount = float(percent_match.group(2))
        result = (rate / 100.0) * amount
        return f"Calculated result: {rate}% of {amount:.2f} is {result:.2f}."

    if len(numbers) < 2:
        return "I detected a calculation request, but I need at least two numeric values."

    left, right = numbers[0], numbers[1]
    if any(k in text for k in ("add", "plus", "+", "sum")):
        return f"Calculated result: {left:.2f} + {right:.2f} = {(left + right):.2f}."
    if any(k in text for k in ("subtract", "minus", "-", "difference")):
        return f"Calculated result: {left:.2f} - {right:.2f} = {(left - right):.2f}."
    if any(k in text for k in ("multiply", "times", "x", "*")):
        return f"Calculated result: {left:.2f} × {right:.2f} = {(left * right):.2f}."
    if any(k in text for k in ("divide", "/")):
        if right == 0:
            return "Cannot divide by zero. Please provide a non-zero divisor."
        return f"Calculated result: {left:.2f} ÷ {right:.2f} = {(left / right):.2f}."

    return f"Calculated result (basic estimate): using {left:.2f} and {right:.2f}."
