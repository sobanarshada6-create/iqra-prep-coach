"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MCQ, UserProfile, AppView, TestAttempt } from "@/lib/types";
import { SUBJECTS } from "@/lib/subjects";
import { Storage } from "@/lib/storage";

interface Props {
  profile: UserProfile;
  onNavigate: (v: AppView) => void;
}

export default function MockExam({ profile, onNavigate }: Props) {
  const [phase, setPhase] = useState<"intro" | "loading" | "active" | "grading" | "result">("intro");
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [displayTime, setDisplayTime] = useState(5400);
  const [result, setResult] = useState<TestAttempt | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startRef = useRef(0);

  const TOTAL_QUESTIONS = 100;
  const TOTAL_TIME = 5400;

  const submitExam = useCallback(async (finalAnswers: Record<string, string>) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("grading");
    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);

    let score = 0;
    mcqs.forEach((m) => { if (finalAnswers[m.id] === m.correct_answer) score++; });

    const attempt: TestAttempt = {
      id: `mock_${Date.now()}`,
      subject_id: "mock",
      subject_name: "Full Mock Exam",
      mcqs,
      answers: finalAnswers,
      score,
      total: mcqs.length,
      time_taken: elapsed,
      feedback: "",
      weak_topics: [],
      attempted_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/grade-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcqs, answers: finalAnswers, subject_name: "Full Mock Exam", time_taken: elapsed }),
      });
      const data = await res.json();
      attempt.feedback = data.feedback || "";
      attempt.weak_topics = data.weak_topics || [];
      data.weak_topics?.forEach((t: string) => Storage.addWeakTopic(t));
    } catch { }

    Storage.saveTestAttempt(attempt);
    const updated = Storage.getUserProfile();
    if (updated) {
      Storage.saveUserProfile({ ...updated, total_mcqs_done: updated.total_mcqs_done + mcqs.length });
    }
    setResult(attempt);
    setPhase("result");
  }, [mcqs]);

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
        const remaining = TOTAL_TIME - elapsed;
        setDisplayTime(remaining);
        if (remaining <= 0) submitExam(answers);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, answers, submitExam]);

  const startExam = async () => {
    setPhase("loading");
    const allMcqs: MCQ[] = [];
    const distribution = [
      { id: "english", count: 20 },
      { id: "general_knowledge", count: 20 },
      { id: "math_iq", count: 20 },
      { id: "pakistan_studies", count: 10 },
      { id: "islamic_studies", count: 10 },
      { id: "computer_it", count: 10 },
      { id: "current_affairs", count: 10 },
    ];

    for (const { id, count } of distribution) {
      try {
        const res = await fetch("/api/generate-mcqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id: id, count, day_number: profile.current_day }),
        });
        const data = await res.json();
        if (data.mcqs) allMcqs.push(...data.mcqs.slice(0, count));
      } catch { }
    }

    const shuffled = allMcqs.sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS);
    setMcqs(shuffled);
    setAnswers({});
    setCurrentIdx(0);
    setDisplayTime(TOTAL_TIME);
    startRef.current = Date.now();
    setPhase("active");
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (phase === "intro") return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📝</div>
        <h2 style={{ color: "var(--foreground)", fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Full Mock Exam
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Simulates the real FGEI BPS-15 Assistant paper
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
          {[
            ["Questions", "100"],
            ["Time Limit", "90 min"],
            ["Negative", "None"],
            ["Subjects", "All 7"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl p-3" style={{ background: "var(--secondary)", border: "1px solid var(--card-border)" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary)" }}>{v}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{k}</div>
            </div>
          ))}
        </div>
        <div className="text-left mb-6 rounded-xl p-4" style={{ background: "var(--secondary)", border: "1px solid var(--card-border)" }}>
          <p style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Paper Distribution:</p>
          {SUBJECTS.map((s) => (
            <div key={s.id} className="flex justify-between" style={{ fontSize: "0.82rem", marginBottom: "3px" }}>
              <span style={{ color: "var(--muted)" }}>{s.icon} {s.name}</span>
              <span style={{ color: s.color, fontWeight: 600 }}>{s.weightage} MCQs</span>
            </div>
          ))}
        </div>
        <button onClick={startExam} style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, var(--accent), var(--primary))",
          color: "#fff", border: "none", borderRadius: "12px",
          fontSize: "1.05rem", fontWeight: 700, cursor: "pointer",
        }}>
          🚀 Start Mock Exam (90 min)
        </button>
      </div>
    </div>
  );

  if (phase === "loading") return (
    <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
      <div className="text-center">
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }} className="animate-pulse-slow">⚙️</div>
        <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 600 }}>Preparing your 100-question paper...</p>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Generating questions from all 7 subjects...</p>
      </div>
    </div>
  );

  if (phase === "grading") return (
    <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
      <div className="text-center">
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }} className="animate-pulse-slow">📊</div>
        <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 600 }}>Grading your full mock exam...</p>
      </div>
    </div>
  );

  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const subjectScores: Record<string, { correct: number; total: number }> = {};
    SUBJECTS.forEach((s) => { subjectScores[s.id] = { correct: 0, total: 0 }; });
    result.mcqs.forEach((m) => {
      if (subjectScores[m.subject_id]) {
        subjectScores[m.subject_id].total++;
        if (result.answers[m.id] === m.correct_answer) subjectScores[m.subject_id].correct++;
      }
    });

    return (
      <div className="p-6 max-w-2xl mx-auto fade-in">
        <div className="text-center mb-6">
          <div style={{
            width: 120, height: 120, borderRadius: "50%", margin: "0 auto 1rem",
            background: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--yellow)" : "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111" }}>{pct}%</div>
              <div style={{ fontSize: "0.72rem", color: "#333" }}>{result.score}/100</div>
            </div>
          </div>
          <h2 style={{ color: "var(--foreground)", fontSize: "1.5rem", fontWeight: 800 }}>
            {pct >= 80 ? "Bohat Khoob! Excellent! 🌟" : pct >= 60 ? "Shabash! Good effort! 👍" : "Himmat rakh! Practice more! 💪"}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
            Time: {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>📊 Subject-wise Breakdown</p>
          {SUBJECTS.map((s) => {
            const ss = subjectScores[s.id];
            if (!ss || ss.total === 0) return null;
            const sp = Math.round((ss.correct / ss.total) * 100);
            return (
              <div key={s.id} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: "0.82rem", color: "var(--foreground)" }}>{s.icon} {s.name}</span>
                  <span style={{ fontSize: "0.82rem", color: sp >= 70 ? "var(--green)" : "var(--accent)", fontWeight: 600 }}>
                    {ss.correct}/{ss.total} ({sp}%)
                  </span>
                </div>
                <div className="progress-bar">
                  <div style={{ height: "100%", borderRadius: 3, width: `${sp}%`, background: sp >= 70 ? "var(--green)" : sp >= 50 ? "var(--yellow)" : "var(--accent)", transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {result.feedback && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <p style={{ color: "var(--primary)", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.9rem" }}>📝 AI Feedback</p>
            <p style={{ color: "var(--foreground)", fontSize: "0.88rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.feedback}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setPhase("intro")} style={{ flex: 1, padding: "12px", background: "var(--secondary)", border: "1px solid var(--card-border)", borderRadius: "10px", color: "var(--foreground)", cursor: "pointer", fontWeight: 600 }}>
            🔄 Retry
          </button>
          <button onClick={() => onNavigate("dashboard")} style={{ flex: 1, padding: "12px", background: "var(--primary)", border: "none", borderRadius: "10px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            📊 Dashboard
          </button>
        </div>
      </div>
    );
  }

  const current = mcqs[currentIdx];
  const isLow = displayTime < 300;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
          📝 Mock Exam &nbsp;·&nbsp; Q{currentIdx + 1}/{mcqs.length} &nbsp;·&nbsp;
          <span style={{ color: "var(--green)" }}>{Object.keys(answers).length} answered</span>
        </div>
        <div style={{
          padding: "6px 14px", borderRadius: "8px", fontFamily: "monospace",
          fontSize: "1rem", fontWeight: 700,
          background: isLow ? "rgba(233,69,96,0.15)" : "var(--secondary)",
          color: isLow ? "var(--accent)" : "var(--foreground)",
          border: `1px solid ${isLow ? "var(--accent)" : "var(--card-border)"}`,
        }}>
          ⏱ {formatTime(displayTime)}
        </div>
      </div>

      <div className="progress-bar mb-4">
        <div className="progress-bar-fill" style={{ width: `${((currentIdx + 1) / mcqs.length) * 100}%` }} />
      </div>

      {current && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="flex justify-between mb-3">
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600 }}>Q {currentIdx + 1}</span>
            <span style={{
              fontSize: "0.72rem", padding: "2px 8px", borderRadius: "8px",
              background: "var(--secondary)", color: "var(--muted)",
            }}>
              {SUBJECTS.find((s) => s.id === current.subject_id)?.icon} {current.subject_name}
            </span>
          </div>
          <p style={{ color: "var(--foreground)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            {current.question}
          </p>
          <div className="space-y-2">
            {Object.entries(current.options).map(([key, val]) => {
              const sel = answers[current.id] === key;
              return (
                <button key={key} onClick={() => setAnswers({ ...answers, [current.id]: key })}
                  style={{
                    width: "100%", padding: "11px 15px", borderRadius: "10px",
                    border: `2px solid ${sel ? "var(--primary)" : "var(--card-border)"}`,
                    background: sel ? "rgba(108,99,255,0.15)" : "var(--secondary)",
                    color: sel ? "var(--primary)" : "var(--foreground)",
                    cursor: "pointer", fontSize: "0.88rem", textAlign: "left",
                    display: "flex", gap: "12px",
                    fontWeight: sel ? 600 : 400, transition: "all 0.15s",
                  }}>
                  <span style={{ fontWeight: 700, minWidth: 20 }}>{key}.</span>
                  <span>{val}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0}
          style={{ padding: "9px 16px", background: "var(--secondary)", border: "1px solid var(--card-border)", borderRadius: "8px", color: currentIdx === 0 ? "var(--card-border)" : "var(--foreground)", cursor: currentIdx === 0 ? "not-allowed" : "pointer" }}>
          ← Prev
        </button>
        {currentIdx < mcqs.length - 1 ? (
          <button onClick={() => setCurrentIdx((i) => i + 1)}
            style={{ flex: 1, padding: "9px", background: "var(--primary)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Next →
          </button>
        ) : (
          <button onClick={() => submitExam(answers)}
            style={{ flex: 1, padding: "9px", background: "linear-gradient(135deg, var(--green), var(--primary))", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
            ✅ Submit ({Object.keys(answers).length}/100)
          </button>
        )}
      </div>

      <div className="p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginBottom: "6px" }}>NAVIGATOR</p>
        <div className="flex flex-wrap gap-1">
          {mcqs.map((m, i) => (
            <button key={m.id} onClick={() => setCurrentIdx(i)}
              style={{
                width: 24, height: 24, borderRadius: "4px", fontSize: "0.6rem", fontWeight: 600,
                border: `1.5px solid ${i === currentIdx ? "var(--primary)" : answers[m.id] ? "var(--green)" : "var(--card-border)"}`,
                background: i === currentIdx ? "rgba(108,99,255,0.2)" : answers[m.id] ? "rgba(0,212,170,0.1)" : "var(--secondary)",
                color: i === currentIdx ? "var(--primary)" : answers[m.id] ? "var(--green)" : "var(--muted)",
                cursor: "pointer",
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
