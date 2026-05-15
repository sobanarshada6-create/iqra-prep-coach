"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MCQ, UserProfile, AppView, TestAttempt } from "@/lib/types";
import { SUBJECTS } from "@/lib/subjects";
import { Storage } from "@/lib/storage";

interface Props {
  profile: UserProfile;
  onNavigate: (v: AppView) => void;
}

type Phase = "setup" | "loading" | "active" | "submitted" | "result";

export default function TestMode({ profile, onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].id);
  const [questionCount, setQuestionCount] = useState(20);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [result, setResult] = useState<TestAttempt | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const subject = SUBJECTS.find((s) => s.id === selectedSubject)!;

  const submitTest = useCallback(async (finalAnswers: Record<string, string>, elapsed: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGradingLoading(true);
    setPhase("submitted");
    setTimeTaken(elapsed);

    try {
      const res = await fetch("/api/grade-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mcqs,
          answers: finalAnswers,
          subject_name: subject.name,
          time_taken: elapsed,
        }),
      });
      const data = await res.json();

      const attempt: TestAttempt = {
        id: `test_${Date.now()}`,
        subject_id: selectedSubject,
        subject_name: subject.name,
        mcqs,
        answers: finalAnswers,
        score: data.score,
        total: data.total,
        time_taken: elapsed,
        feedback: data.feedback,
        weak_topics: data.weak_topics || [],
        attempted_at: new Date().toISOString(),
      };
      Storage.saveTestAttempt(attempt);
      data.weak_topics?.forEach((t: string) => Storage.addWeakTopic(t));

      const updated = Storage.getUserProfile();
      if (updated) {
        const newTotal = updated.total_mcqs_done + mcqs.length;
        const allAttempts = Storage.getTestAttempts();
        const avgAcc = allAttempts.length > 0
          ? Math.round(allAttempts.reduce((a, b) => a + (b.score / b.total) * 100, 0) / allAttempts.length)
          : data.percentage;
        Storage.saveUserProfile({ ...updated, total_mcqs_done: newTotal, overall_accuracy: avgAcc });
      }

      setResult(attempt);
      setPhase("result");
    } catch (e) {
      setError(String(e));
      setPhase("setup");
    } finally {
      setGradingLoading(false);
    }
  }, [mcqs, subject.name, selectedSubject]);

  useEffect(() => {
    if (phase === "active") {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = timeLeft - elapsed;
        if (remaining <= 0) {
          const elapsed2 = Math.floor((Date.now() - startTimeRef.current) / 1000);
          submitTest(answers, elapsed2);
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft, answers, submitTest]);

  const [displayTime, setDisplayTime] = useState(0);
  useEffect(() => {
    if (phase === "active") {
      const t = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDisplayTime(timeLeft - elapsed);
      }, 1000);
      return () => clearInterval(t);
    }
  }, [phase, timeLeft]);

  const startTest = async () => {
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/generate-mcqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: selectedSubject,
          count: questionCount,
          day_number: profile.current_day,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMcqs(data.mcqs);
      setAnswers({});
      setCurrentIdx(0);
      const secs = questionCount * 90;
      setTimeLeft(secs);
      setDisplayTime(secs);
      setPhase("active");
    } catch (e) {
      setError(String(e));
      setPhase("setup");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (phase === "setup") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 style={{ color: "var(--foreground)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.3rem" }}>
          ✏️ Subject-wise Test
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Timed MCQ test with AI grading and personalized feedback.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.3)", color: "var(--accent)", fontSize: "0.85rem" }}>
            ⚠️ {error}
          </div>
        )}
        <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="mb-5">
            <label style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>SELECT SUBJECT</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUBJECTS.map((s) => (
                <button key={s.id} onClick={() => setSelectedSubject(s.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    border: `2px solid ${selectedSubject === s.id ? s.color : "var(--card-border)"}`,
                    background: selectedSubject === s.id ? `${s.color}20` : "var(--secondary)",
                    color: selectedSubject === s.id ? s.color : "var(--foreground)",
                    cursor: "pointer", fontSize: "0.82rem",
                    fontWeight: selectedSubject === s.id ? 700 : 400, transition: "all 0.2s",
                  }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label style={{ color: "var(--muted)", fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              QUESTIONS: {questionCount} &nbsp;|&nbsp; TIME: ~{Math.round(questionCount * 1.5)} min
            </label>
            <input type="range" min={10} max={50} step={5} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}
              style={{ width: "100%", accentColor: subject.color }} />
          </div>
          <button onClick={startTest}
            style={{
              width: "100%", padding: "14px",
              background: `linear-gradient(135deg, ${subject.color}, var(--primary))`,
              color: "#fff", border: "none", borderRadius: "10px",
              fontSize: "1rem", fontWeight: 700, cursor: "pointer",
            }}>
            🚀 Start {questionCount}-Question Test
          </button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
        <div className="text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }} className="animate-pulse-slow">⚙️</div>
          <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 600 }}>Generating {questionCount} questions with AI...</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>Hang tight, Iqra! Quality questions take a moment.</p>
        </div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="flex items-center justify-center h-full" style={{ minHeight: 400 }}>
        <div className="text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }} className="animate-pulse-slow">📊</div>
          <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 600 }}>Grading your test...</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>AI is analyzing your answers and writing feedback.</p>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100);
    const mins = Math.floor(result.time_taken / 60);
    const secs = result.time_taken % 60;
    return (
      <div className="p-6 max-w-2xl mx-auto fade-in">
        <div className="text-center mb-6">
          <div style={{
            width: 100, height: 100, borderRadius: "50%", margin: "0 auto 1rem",
            background: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--yellow)" : "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#111" }}>{pct}%</span>
          </div>
          <h2 style={{ color: "var(--foreground)", fontSize: "1.4rem", fontWeight: 800 }}>
            {pct >= 80 ? "Shabash Iqra! 🌟" : pct >= 50 ? "Acha hua! Keep going 💪" : "Himmat rakh! 🔥"}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            {result.score}/{result.total} correct &nbsp;·&nbsp; {mins}m {secs}s &nbsp;·&nbsp; {subject.name}
          </p>
        </div>

        {/* Feedback */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p style={{ color: "var(--primary)", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.9rem" }}>
            📝 AI Coach Feedback
          </p>
          <p style={{ color: "var(--foreground)", fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {result.feedback}
          </p>
        </div>

        {/* Weak Topics */}
        {result.weak_topics.length > 0 && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(233,69,96,0.08)", border: "1px solid rgba(233,69,96,0.3)" }}>
            <p style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              ⚠️ Focus These Topics Next
            </p>
            <div className="flex flex-wrap gap-2">
              {result.weak_topics.map((t) => (
                <span key={t} style={{ padding: "4px 12px", background: "rgba(233,69,96,0.15)", border: "1px solid rgba(233,69,96,0.4)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--accent)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wrong Answers */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>
            ❌ Wrong Answers Review ({result.total - result.score})
          </p>
          <div className="space-y-3">
            {result.mcqs.filter((m) => result.answers[m.id] !== m.correct_answer).slice(0, 10).map((m) => (
              <div key={m.id} className="rounded-xl p-3" style={{ background: "var(--secondary)", border: "1px solid var(--card-border)" }}>
                <p style={{ color: "var(--foreground)", fontSize: "0.85rem", marginBottom: "6px" }}>{m.question}</p>
                <div className="flex gap-3 text-sm flex-wrap">
                  <span style={{ color: "var(--accent)", fontSize: "0.78rem" }}>Your: {result.answers[m.id] || "—"}</span>
                  <span style={{ color: "var(--green)", fontSize: "0.78rem" }}>✓ {m.correct_answer}: {m.options[m.correct_answer]}</span>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "6px" }}>{m.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setPhase("setup")} style={{ flex: 1, padding: "12px", background: "var(--secondary)", border: "1px solid var(--card-border)", borderRadius: "10px", color: "var(--foreground)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
            🔄 Try Again
          </button>
          <button onClick={() => onNavigate("dashboard")} style={{ flex: 1, padding: "12px", background: "var(--primary)", border: "none", borderRadius: "10px", color: "#fff", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
            📊 View Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Active Test
  const current = mcqs[currentIdx];
  const answered = Object.keys(answers).length;
  const isLowTime = displayTime < 120;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Timer Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {subject.icon} {subject.name}
          </span>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {currentIdx + 1}/{mcqs.length}
          </span>
          <span style={{ color: "var(--green)", fontSize: "0.85rem" }}>
            {answered} answered
          </span>
        </div>
        <div
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            background: isLowTime ? "rgba(233,69,96,0.15)" : "var(--secondary)",
            border: `1px solid ${isLowTime ? "var(--accent)" : "var(--card-border)"}`,
            fontFamily: "monospace",
            fontSize: "1rem",
            fontWeight: 700,
            color: isLowTime ? "var(--accent)" : "var(--foreground)",
          }}
        >
          ⏱ {formatTime(displayTime)}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-5">
        <div className="progress-bar-fill" style={{ width: `${((currentIdx + 1) / mcqs.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <div className="flex justify-between items-start mb-4 gap-3">
          <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 600 }}>Q {currentIdx + 1}</p>
          <span style={{
            padding: "2px 8px", borderRadius: "8px", fontSize: "0.72rem",
            background: current.difficulty === "easy" ? "rgba(0,212,170,0.15)" : current.difficulty === "medium" ? "rgba(255,215,0,0.15)" : "rgba(233,69,96,0.15)",
            color: current.difficulty === "easy" ? "var(--green)" : current.difficulty === "medium" ? "var(--yellow)" : "var(--accent)",
          }}>
            {current.difficulty}
          </span>
        </div>
        <p style={{ color: "var(--foreground)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          {current.question}
        </p>
        <div className="space-y-2">
          {Object.entries(current.options).map(([key, val]) => {
            const isSelected = answers[current.id] === key;
            return (
              <button
                key={key}
                onClick={() => setAnswers({ ...answers, [current.id]: key })}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: `2px solid ${isSelected ? subject.color : "var(--card-border)"}`,
                  background: isSelected ? `${subject.color}20` : "var(--secondary)",
                  color: isSelected ? subject.color : "var(--foreground)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  textAlign: "left",
                  display: "flex",
                  gap: "12px",
                  fontWeight: isSelected ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontWeight: 700, minWidth: 20 }}>{key}.</span>
                <span>{val}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          style={{
            padding: "10px 20px",
            background: "var(--secondary)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            color: currentIdx === 0 ? "var(--card-border)" : "var(--foreground)",
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← Prev
        </button>
        {currentIdx < mcqs.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((i) => i + 1)}
            style={{
              flex: 1,
              padding: "10px",
              background: "var(--primary)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              submitTest(answers, elapsed);
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: "linear-gradient(135deg, var(--green), var(--primary))",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            ✅ Submit Test ({answered}/{mcqs.length} answered)
          </button>
        )}
      </div>

      {/* Question grid */}
      <div className="mt-4 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "8px" }}>QUESTION NAVIGATOR</p>
        <div className="flex flex-wrap gap-1.5">
          {mcqs.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setCurrentIdx(i)}
              style={{
                width: 30, height: 30,
                borderRadius: "6px",
                border: `1.5px solid ${i === currentIdx ? subject.color : answers[m.id] ? "var(--green)" : "var(--card-border)"}`,
                background: i === currentIdx ? `${subject.color}20` : answers[m.id] ? "rgba(0,212,170,0.1)" : "var(--secondary)",
                color: i === currentIdx ? subject.color : answers[m.id] ? "var(--green)" : "var(--muted)",
                cursor: "pointer",
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
