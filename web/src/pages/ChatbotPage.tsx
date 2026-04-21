import { useState } from "react";
import type { FormEvent } from "react";

import { chatApi } from "../lib/api/chat.api";
import { getErrorMessage } from "../lib/api/helpers";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      content: value,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setError(null);
    setIsSending(true);

    try {
      const result = await chatApi.send(value);
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-2">
        <h1 className="text-xl font-semibold">BFSI Assistant</h1>
        <p className="text-sm text-slate-400">
          Ask banking, financial services, insurance, compliance, risk, and payments related questions.
        </p>
      </section>

      <section className="card h-[60vh] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">Start by asking a BFSI question.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-xl bg-blue-600 px-3 py-2 text-sm text-white"
                  : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              }
            >
              {message.content}
            </div>
          ))
        )}
        {isSending ? <p className="text-xs text-slate-400">Assistant is thinking...</p> : null}
      </section>

      <section className="card">
        <form className="space-y-2" onSubmit={handleSubmit}>
          <textarea
            className="input min-h-[96px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: Explain KYC requirements for onboarding in retail banking"
          />
          <div className="flex items-center justify-between gap-2">
            {error ? <p className="text-xs text-red-300">{error}</p> : <span />}
            <button className="btn" type="submit" disabled={isSending || !query.trim()}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
