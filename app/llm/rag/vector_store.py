"""Vector store abstraction placeholder for RAG."""


class VectorStore:
    """Minimal vector-store contract."""

    def upsert(self, ids: list[str], embeddings: list[list[float]], metadata: list[dict] | None = None) -> None:
        raise NotImplementedError("Vector store upsert is not implemented yet")

    def search(self, query_embedding: list[float], top_k: int = 5) -> list[dict]:
        raise NotImplementedError("Vector store search is not implemented yet")
