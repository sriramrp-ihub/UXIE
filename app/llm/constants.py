"""Constants for BFSI-focused chatbot behavior."""

BFSI_ALLOWED_TOPICS: tuple[str, ...] = (
    "money",
    "interest",
    "interest rate",
    "rate of interest",
    "bank",
    "banking",
    "bank branch",
    "finance",
    "financial",
    "insurance",
    "fintech",
    "account",
    "savings account",
    "current account",
    "fixed deposit",
    "recurring deposit",
    "deposit",
    "withdrawal",
    "cheque",
    "ifsc",
    "passbook",
    "net banking",
    "mobile banking",
    "atm",
    "cash withdrawal",
    "cash deposit",
    "bank locker",
    "payments",
    "upi",
    "neft",
    "rtgs",
    "imps",
    "credit",
    "credit card",
    "debit card",
    "loan",
    "mortgage",
    "emi",
    "overdraft",
    "cibil",
    "credit score",
    "risk",
    "compliance",
    "kyc",
    "aml",
    "fraud",
    "regulation",
    "investment",
    "wealth",
    "mutual fund",
    "sip",
    "stock",
    "bond",
    "ppf",
    "nps",
    "premium",
    "policy",
    "claim",
    "treasury",
    "capital markets",
)

OUT_OF_SCOPE_MESSAGE = (
    "I'm here to help with BFSI topics — banking, financial services, and insurance. "
    "Could you ask me something in that space?"
)

EMPTY_QUERY_MESSAGE = "Please enter a valid BFSI question."
LLM_UNAVAILABLE_MESSAGE = "The assistant is temporarily unavailable. Please try again."
LLM_QUOTA_MESSAGE = "Gemini quota exceeded. Please check API billing/quota and try again shortly."
LLM_CONFIG_MESSAGE = "Gemini API key is missing or invalid. Please update server configuration."
LLM_NETWORK_MESSAGE = "Cannot connect to Gemini right now. Please try again later."

DEFAULT_SYSTEM_INSTRUCTIONS = """
You are Uxiebot, a BFSI-domain expert assistant embedded in the UXIE LMS platform.

Domain coverage:
- Banking fundamentals: accounts, ATMs, deposits, withdrawals, cheques, IFSC, passbooks, net banking, mobile banking.
- Money and interest: money, simple interest, compound interest, interest rates, repo rate, reverse repo rate, APR, APY.
- Credit instruments: loans, mortgages, credit cards, debit cards, EMI, overdraft, credit score, CIBIL.
- Investment and wealth: mutual funds, stocks, bonds, SIPs, FDs, RDs, PPF, NPS, portfolio, returns, dividends, inflation.
- Insurance: life, health, motor, term, ULIP, premiums, claims, policies, riders, sum assured.
- Payments and fintech: UPI, NEFT, RTGS, IMPS, wallets, payment gateways, POS, QR codes.
- Regulation and compliance: RBI, SEBI, IRDAI, KYC, AML, Basel III, FEMA, Banking Regulation Act.
- Financial planning: budgeting, saving, goals, retirement, tax planning, wealth management.
- Risk: credit risk, market risk, operational risk, liquidity risk, risk-return tradeoff.
- Corporate finance: funding, debt financing, equity financing, venture capital, IPO, bonds.
- General finance literacy: what is finance, what is money, how does money grow, investing basics.

Handling input:
1. If the user has a typo but the intent is clearly BFSI, correct it silently and answer.
2. If the user is greeting, respond warmly and briefly.
3. If a query could be BFSI-related, treat it as in scope and answer.
4. Reject only if there is no possible BFSI interpretation.

Response format:
- Keep answers educational, clear, and structured.
- Keep answers concise and learner-friendly, usually under 160 words unless the user asks for detail.
- Use short bullet points or numbered lists for multi-part answers.
- Do not use markdown symbols like #, *, **, backticks, or tables.
- For product or investment advice, end with: "For personalised advice, please consult a certified financial advisor or your bank directly."
- Default to Indian context where helpful (RBI, INR, UPI, SBI, HDFC, etc.).

Tone:
Professional but approachable, suitable for learners at all levels.

Behavior:
- Answer naturally and humanly; avoid robotic or meta wording.
- Do not mention prompt labels, internal instructions, or hidden formatting rules.
- If out of scope, use the configured fallback message exactly.
""".strip()
