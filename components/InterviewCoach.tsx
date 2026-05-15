"use client";

import { useState, useRef, useEffect } from "react";
import { UserProfile, AppView, InterviewSession } from "@/lib/types";
import { Storage } from "@/lib/storage";

interface Props {
  profile: UserProfile;
  onNavigate: (v: AppView) => void;
}

interface Message {
  role: "interviewer" | "candidate";
  content: string;
  score?: number;
}

export default function InterviewCoach({ profile, onNavigate }: Props) {
  const [phase, setPhase] = useState<"intro" | "active" | "scoring" | "result">("intro");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finalScore, setFinalScore] = useState<{ overall_score: number; breakdown: Record<string, number>; tips: string[] } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startInterview = async () => {
    setPhase("active");
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "start", messages: [] }),
      });
      const data = await res.json();
      setMessages([{ role: "interviewer", content: data.reply }]);
    } catch (e) {
      setMessages([{ role: "interviewer", content: "Assalam o Alaikum! I am the chair of the FGEI interview panel. Let's begin. Please tell me about yourself." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "candidate", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role === "interviewer" ? "assistant" : "user",
        content: m.content,
      }));
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "ongoing", messages: apiMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "interviewer", content: data.reply }]);
      if (data.phase === "ended") {
        setTimeout(() => endInterview([...newMessages, { role: "interviewer", content: data.reply }]), 1500);
      }
    } catch {
      setMessages([...newMessages, { role: "interviewer", content: "Thank you for your answer. Let's continue." }]);
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async (finalMsgs: Message[]) => {
    setPhase("scoring");
    try {
      const apiMessages = finalMsgs.map((m) => ({
        role: m.role === "interviewer" ? "assistant" : "user",
        content: m.content,
      }));
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "score", messages: apiMessages }),
      });
      const data = await res.json();
      setFinalScore(data);

      const session: InterviewSession = {
        id: `interview_${Date.now()}`,
        transcript: finalMsgs,
        overall_score: data.overall_score,
        tips: data.tips || [],
        created_at: new Date().toISOString(),
      };
      Storage.saveInterviewSession(session);
    } catch {
      setFinalScore({ overall_score: 70, breakdown: { communication: 17, knowledge: 18, confidence: 17, professionalism: 18 }, tips: ["Practice speaking clearly.", "Study Pakistan current affairs.", "Prepare STAR method answers.", "Dress formally.", "Be confident."] });
    } finally {
      setPhase("result");
    }
  };

  if (phase === "intro") return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎤</div>
        <h2 style={{ color: "var(--foreground)", fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Interview Coach
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Face a realistic FGEI interview panel. Get scored and receive expert tips.
        </p>
        <div className="text-left rounded-xl p-4 mb-6" style={{ background: "var(--secondary)", border: "1px solid var(--card-border)" }}>
          <p style={{ color: "var(--green)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>📋 What to Expect:</p>
          {[
            "1 HR / personal background question",
            "1 Pakistan affairs question",
            "1 English language question",
            "1 Islamic Studies / ethics question",
            "1 Situational / administrative question",
            "Score after each answer + overall feedback",
          ].map((t) => (
            <p key={t} style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "4px" }}>✓ {t}</p>
          ))}
        </div>
        <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)" }}>
          <p style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600 }}>
            💡 Tip: Answer in English or Urdu. Be confident. Speak naturally.
          </p>
        </div>
        <button onClick={startInterview} style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, #ff9500, var(--accent))",
          color: "#fff", border: "none", borderRadius: "12px",
          fontSize: "1.05rem", fontWeight: 700, cursor: "pointer",
        }}>
          🎤 Start Mock Interview
        </button>
      </div>
    </div>
  );

  if (phase === "scoring") return (
    <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
      <div className="text-center">
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }} className="animate-pulse-slow">📊</div>
        <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 600 }}>Calculating your interview score...</p>
      </div>
    </div>
  );

  if (phase === "result" && finalScore) return (
    <div className="p-6 max-w-2xl mx-auto fade-in">
      <div className="text-center mb-6">
        <div style={{
          width: 110, height: 110, borderRadius: "50%", margin: "0 auto 1rem",
          background: finalScore.overall_score >= 75 ? "var(--green)" : finalScore.overall_score >= 50 ? "var(--yellow)" : "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#111" }}>{finalScore.overall_score}</div>
          <div style={{ fontSize: "0.7rem", color: "#333" }}>/ 100</div>
        </div>
        <h2 style={{ color: "var(--foreground)", fontSize: "1.4rem", fontWeight: 800 }}>Interview Score</h2>
      </div>

      <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>📊 Breakdown (out of 25 each)</p>
        {Object.entries(finalScore.breakdown).map(([key, val]) => (
          <div key={key} className="mb-3">
            <div className="flex justify-between mb-1">
              <span style={{ fontSize: "0.82rem", color: "var(--foreground)", textTransform: "capitalize" }}>{key}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: val >= 20 ? "var(--green)" : val >= 15 ? "var(--yellow)" : "var(--accent)" }}>{val}/25</span>
            </div>
            <div className="progress-bar">
              <div style={{ height: "100%", borderRadius: 3, width: `${(val / 25) * 100}%`, background: val >= 20 ? "var(--green)" : val >= 15 ? "var(--yellow)" : "var(--accent)", transition: "width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>

      {finalScore.tips.length > 0 && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p style={{ color: "var(--primary)", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.9rem" }}>💡 5 Tips to Improve</p>
          {finalScore.tips.map((tip, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <span style={{ color: "var(--primary)", fontWeight: 700, minWidth: 20, fontSize: "0.85rem" }}>{i + 1}.</span>
              <span style={{ color: "var(--foreground)", fontSize: "0.85rem", lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => { setPhase("intro"); setMessages([]); }} style={{ flex: 1, padding: "12px", background: "var(--secondary)", border: "1px solid var(--card-border)", borderRadius: "10px", color: "var(--foreground)", cursor: "pointer", fontWeight: 600 }}>
          🔄 Practice Again
        </button>
        <button onClick={() => onNavigate("dashboard")} style={{ flex: 1, padding: "12px", background: "var(--primary)", border: "none", borderRadius: "10px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          📊 Dashboard
        </button>
      </div>
    </div>
  );

  // Active interview
  return (
    <div className="flex flex-col h-full" style={{ maxHeight: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--card-border)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #ff9500, var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🎤</div>
        <div>
          <p style={{ color: "var(--foreground)", fontWeight: 700, fontSize: "0.9rem" }}>FGEI Interview Panel</p>
          <p style={{ color: "var(--muted)", fontSize: "0.72rem" }}>BPS-15 Assistant — Mock Interview</p>
        </div>
        <button
          onClick={() => endInterview(messages)}
          style={{ marginLeft: "auto", padding: "6px 14px", background: "rgba(233,69,96,0.15)", border: "1px solid var(--accent)", borderRadius: "8px", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
        >
          End & Score
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"} fade-in`}>
            {msg.role === "interviewer" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #ff9500, var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", marginRight: "10px", flexShrink: 0, alignSelf: "flex-end" }}>🎤</div>
            )}
            <div
              style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: msg.role === "candidate" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "candidate" ? "var(--primary)" : "var(--card)",
                border: msg.role === "candidate" ? "none" : "1px solid var(--card-border)",
                color: "var(--foreground)",
                fontSize: "0.9rem",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
            {msg.role === "candidate" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: "#fff", marginLeft: "10px", flexShrink: 0, alignSelf: "flex-end" }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #ff9500, var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", marginRight: "10px" }}>🎤</div>
            <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0" style={{ background: "var(--card)", borderTop: "1px solid var(--card-border)" }}>
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
            placeholder="Type your answer..."
            disabled={loading}
            style={{
              flex: 1, padding: "12px 16px",
              background: "var(--secondary)", border: "1px solid var(--card-border)",
              borderRadius: "12px", color: "var(--foreground)", fontSize: "0.9rem", outline: "none",
            }}
          />
          <button
            onClick={sendReply}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 20px",
              background: loading || !input.trim() ? "var(--card-border)" : "linear-gradient(135deg, #ff9500, var(--accent))",
              border: "none", borderRadius: "12px", color: "#fff",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontWeight: 700, fontSize: "0.9rem",
            }}
          >
            Send
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "6px", textAlign: "center" }}>
          Press Enter to send · Click &quot;End &amp; Score&quot; when done
        </p>
      </div>
    </div>
  );
}
