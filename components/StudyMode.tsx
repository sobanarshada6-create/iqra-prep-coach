"use client";

import { useState, useCallback } from "react";
import { MCQ, UserProfile, AppView } from "@/lib/types";
import { SUBJECTS } from "@/lib/subjects";
import { Storage } from "@/lib/storage";

interface Props {
  profile: UserProfile;
  onNavigate: (v: AppView) => void;
}

export default function StudyMode({ profile, onNavigate }: Props) {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].id);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>(Storage.getBookmarks());
  const [weakMarked, setWeakMarked] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [sessionStarted, setSessionStarted] = useState(false);

  const subject = SUBJECTS.find((s) => s.id === selectedSubject)!;

  const startSession = useCallback(async () => {
    setLoading(true);
    setError("");
    setMcqs([]);
    setCurrentIdx(0);
    setFlipped(false);

    try {
      const res = await fetch("/api/generate-mcqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: selectedSubject,
          count,
          day_number: profile.current_day,
          served_topics: Storage.getWeakTopics(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate MCQs");
      setMcqs(data.mcqs);
      Storage.addServedMCQIds(data.mcqs.map((m: MCQ) => m.id));
      setSessionStarted(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, count, profile.current_day]);

  const toggleBookmark = (id: string) => {
    const added = Storage.toggleBookmark(id);
    setBookmarks(added ? [...bookmarks, id] : bookmarks.filter((b) => b !== id));
  };

  const markWeak = (topic: string) => {
    Storage.addWeakTopic(topic);
    if (!weakMarked.includes(topic)) setWeakMarked([...weakMarked, topic]);
  };

  const current = mcqs[currentIdx];

  if (!sessionStarted) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 style={{ color: "var(--foreground)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.3rem" }}>
            📚 Study Mode — Flashcards
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Learn with AI-generated flashcards. Flip to see the answer and explanation.
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="mb-5">
            <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: "8px", fontWeight: 600 }}>
              SELECT SUBJECT
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `2px solid ${selectedSubject === s.id ? s.color : "var(--card-border)"}`,
                    background: selectedSubject === s.id ? `${s.color}20` : "var(--secondary)",
                    color: selectedSubject === s.id ? s.color : "var(--foreground)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: selectedSubject === s.id ? 700 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label style={{ color: "var(--muted)", fontSize: "0.8rem", display: "block", marginBottom: "8px", fontWeight: 600 }}>
              NUMBER OF MCQs: {count}
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: "100%", accentColor: subject.color }}
            />
            <div className="flex justify-between" style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
              <span>5</span><span>50</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.3)", color: "var(--accent)", fontSize: "0.85rem" }}>
              ⚠️ {error}. Please check your API key in .env.local
            </div>
          )}

          <button
            onClick={startSession}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "var(--card-border)" : `linear-gradient(135deg, ${subject.color}, var(--primary))`,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳ Generating fresh MCQs with AI..." : `🚀 Generate ${count} ${subject.name} MCQs`}
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const isBookmarked = bookmarks.includes(current.id);
  const isWeak = weakMarked.includes(current.topic);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSessionStarted(false)}
            style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
          >
            ← Back
          </button>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {subject.icon} {subject.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {currentIdx + 1} / {mcqs.length}
          </span>
          <div
            style={{
              width: 100,
              height: 6,
              background: "var(--card-border)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((currentIdx + 1) / mcqs.length) * 100}%`,
                background: subject.color,
                borderRadius: 3,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Difficulty Badge */}
      <div className="flex gap-2 mb-4">
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.72rem",
            fontWeight: 600,
            background:
              current.difficulty === "easy"
                ? "rgba(0,212,170,0.15)"
                : current.difficulty === "medium"
                ? "rgba(255,215,0,0.15)"
                : "rgba(233,69,96,0.15)",
            color:
              current.difficulty === "easy"
                ? "var(--green)"
                : current.difficulty === "medium"
                ? "var(--yellow)"
                : "var(--accent)",
          }}
        >
          {current.difficulty.toUpperCase()}
        </span>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.72rem",
            background: "var(--secondary)",
            color: "var(--muted)",
          }}
        >
          {current.topic}
        </span>
      </div>

      {/* Flashcard */}
      <div
        className={`flip-card ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(!flipped)}
        style={{ cursor: "pointer", marginBottom: "1.5rem", minHeight: 250 }}
      >
        <div className="flip-card-inner" style={{ position: "relative", width: "100%", minHeight: 250 }}>
          {/* Front */}
          <div
            className="flip-card-front rounded-2xl p-6"
            style={{
              background: "var(--card)",
              border: `2px solid ${subject.color}40`,
              minHeight: 250,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "absolute",
              width: "100%",
            }}
          >
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginBottom: "1rem", fontWeight: 600 }}>
              QUESTION {currentIdx + 1}
            </p>
            <p style={{ color: "var(--foreground)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {current.question}
            </p>
            <div className="space-y-2">
              {Object.entries(current.options).map(([key, val]) => (
                <div
                  key={key}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "var(--secondary)",
                    fontSize: "0.85rem",
                    color: "var(--foreground)",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: subject.color, fontWeight: 700, minWidth: 18 }}>{key}.</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: "1rem", textAlign: "center" }}>
              👆 Tap to reveal answer
            </p>
          </div>

          {/* Back */}
          <div
            className="flip-card-back rounded-2xl p-6"
            style={{
              background: `linear-gradient(135deg, ${subject.color}20, var(--card))`,
              border: `2px solid ${subject.color}`,
              minHeight: 250,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "absolute",
              width: "100%",
            }}
          >
            <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginBottom: "0.5rem", fontWeight: 600 }}>
              CORRECT ANSWER
            </p>
            <p
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: "var(--green)",
                marginBottom: "1rem",
              }}
            >
              {current.correct_answer}: {current.options[current.correct_answer]}
            </p>
            <div
              style={{
                background: "rgba(0,212,170,0.08)",
                border: "1px solid rgba(0,212,170,0.2)",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "0.5rem",
              }}
            >
              <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 600, marginBottom: "4px" }}>
                EXPLANATION
              </p>
              <p style={{ color: "var(--foreground)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                {current.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => toggleBookmark(current.id)}
          style={{
            flex: 1,
            padding: "10px",
            background: isBookmarked ? "rgba(255,215,0,0.15)" : "var(--secondary)",
            border: `1px solid ${isBookmarked ? "var(--yellow)" : "var(--card-border)"}`,
            borderRadius: "10px",
            color: isBookmarked ? "var(--yellow)" : "var(--muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {isBookmarked ? "🔖 Bookmarked" : "🔖 Bookmark"}
        </button>
        <button
          onClick={() => markWeak(current.topic)}
          style={{
            flex: 1,
            padding: "10px",
            background: isWeak ? "rgba(233,69,96,0.15)" : "var(--secondary)",
            border: `1px solid ${isWeak ? "var(--accent)" : "var(--card-border)"}`,
            borderRadius: "10px",
            color: isWeak ? "var(--accent)" : "var(--muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {isWeak ? "⚠️ Weak Marked" : "⚠️ Mark Weak"}
        </button>
        <button
          onClick={() => {
            setFlipped(false);
            setTimeout(() => setCurrentIdx((i) => Math.max(0, i - 1)), 100);
          }}
          disabled={currentIdx === 0}
          style={{
            padding: "10px 18px",
            background: "var(--secondary)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            color: currentIdx === 0 ? "var(--card-border)" : "var(--foreground)",
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
            fontSize: "0.85rem",
          }}
        >
          ←
        </button>
        <button
          onClick={() => {
            setFlipped(false);
            setTimeout(() => {
              if (currentIdx < mcqs.length - 1) setCurrentIdx((i) => i + 1);
              else onNavigate("test");
            }, 100);
          }}
          style={{
            padding: "10px 18px",
            background: currentIdx === mcqs.length - 1 ? "var(--green)" : "var(--primary)",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {currentIdx === mcqs.length - 1 ? "✅ Done! → Test" : "Next →"}
        </button>
      </div>
    </div>
  );
}
