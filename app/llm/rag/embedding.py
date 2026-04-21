"""Embedding placeholder for future RAG pipeline."""


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate vector embeddings for a list of texts.

    TODO: integrate Gemini embedding model or external provider.
    """
    raise NotImplementedError("Embedding generation is not implemented yet")
