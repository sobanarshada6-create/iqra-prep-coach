"use client";

import { useState, useRef, useEffect } from "react";
import { UserProfile } from "@/lib/types";

interface Props {
  profile: UserProfile;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatAssistant({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Assalam o Alaikum, ${profile.name}! 👋\n\nI'm your AI tutor. Ask me anything about your FGEI exam — concepts, tips, current affairs, grammar rules, anything!\n\nKya poochna hai? 📚`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please check your API key and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open ? "var(--accent)" : "linear-gradient(135deg, var(--primary), var(--green))",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          boxShadow: "0 4px 20px rgba(108,99,255,0.5)",
          zIndex: 1000,
          transition: "all 0.2s",
        }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fade-in"
          style={{
            position: "fixed",
            bottom: "90px",
            right: "24px",
            width: 360,
            height: 480,
            background: "var(--card)",
            border: "1px solid var(--card-border)",
            borderRadius: "20px",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🎓</div>
            <div>
              <p style={{ color: "var(--foreground)", fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.2 }}>Iqra Prep Coach</p>
              <p style={{ color: "var(--green)", fontSize: "0.68rem" }}>● AI Tutor Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 13px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "var(--primary)" : "var(--secondary)",
                    border: msg.role === "user" ? "none" : "1px solid var(--card-border)",
                    color: "var(--foreground)",
                    fontSize: "0.83rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div style={{ padding: "10px 13px", borderRadius: "16px 16px 16px 4px", background: "var(--secondary)", border: "1px solid var(--card-border)" }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px", borderTop: "1px solid var(--card-border)" }}>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything..."
                style={{
                  flex: 1, padding: "9px 12px",
                  background: "var(--secondary)", border: "1px solid var(--card-border)",
                  borderRadius: "10px", color: "var(--foreground)", fontSize: "0.83rem", outline: "none",
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                style={{
                  padding: "9px 14px",
                  background: loading || !input.trim() ? "var(--card-border)" : "var(--primary)",
                  border: "none", borderRadius: "10px", color: "#fff",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  fontWeight: 700, fontSize: "0.85rem",
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
