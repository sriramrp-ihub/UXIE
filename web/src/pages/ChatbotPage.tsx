import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { chatApi } from "../lib/api/chat.api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = ["What is banking", "How to invest money", "Explain insurance"];

export default function ChatbotPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(raw: string) {
    const value = raw.trim();
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
      console.error("Chat error:", err);
      setError("⚠️ Unable to connect. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: "assistant",
          content: "⚠️ Unable to connect. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(query);
  }

  return (
    <div className="flex justify-center bg-[#f8fafc] px-4 py-5">
      <section className="w-full max-w-[700px] rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-slate-900">BFSI Assistant</h1>
          <p className="mt-1 text-sm text-slate-600">Ask about banking, finance, insurance, risk, and compliance.</p>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
          {SUGGESTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              onClick={() => setQuery(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="h-[55vh] overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">Start by asking a BFSI question.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[85%] rounded-xl bg-[#2563eb] px-3 py-2 text-sm text-white"
                        : "max-w-[85%] whitespace-pre-wrap rounded-xl bg-[#e5e7eb] px-3 py-2 text-sm text-slate-800"
                    }
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isSending ? <p className="text-xs text-slate-500">Bot is typing...</p> : null}
            <div ref={bottomRef} />
          </div>
        </div>

        <form className="sticky bottom-0 border-t border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
          <div className="flex items-end gap-2">
            <textarea
              className="input min-h-[52px] flex-1 rounded-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about banking, finance, insurance..."
            />
            <button
              className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSending || !query.trim()}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
