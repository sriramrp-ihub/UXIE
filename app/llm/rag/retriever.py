"""Retriever placeholder for future retrieval logic."""

from app.llm.rag.embedding import generate_embeddings
from app.llm.rag.vector_store import VectorStore


class Retriever:
    """Simple retrieval orchestrator for future RAG flows."""

    def __init__(self, store: VectorStore) -> None:
        self.store = store

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        query_embedding = generate_embeddings([query])[0]
        return self.store.search(query_embedding=query_embedding, top_k=top_k)
