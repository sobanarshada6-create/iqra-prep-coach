"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/types";

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const profile: UserProfile = {
      name: name.trim(),
      exam_date: examDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      current_day: 1,
      total_mcqs_done: 0,
      overall_accuracy: 0,
      streak: 0,
      weak_topics: [],
    };
    onComplete(profile);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎓</div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--primary), var(--green))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            Iqra Prep Coach
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            FGEI BPS-15 Assistant — AI-Powered 15-Day Exam Prep
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ color: "var(--foreground)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Assalam o Alaikum! 👋
              </h2>
              <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                I&apos;m your personal AI tutor. Let&apos;s get you ready for the FGEI BPS-15 Assistant exam in just 15 days!
              </p>

              <div className="mb-4">
                <label style={{ color: "var(--muted)", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Iqra"
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(2)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--secondary)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "10px",
                    color: "var(--foreground)",
                    fontSize: "1rem",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: name.trim() ? "linear-gradient(135deg, var(--primary), #5a52e0)" : "var(--card-border)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: name.trim() ? "pointer" : "not-allowed",
                  marginTop: "1rem",
                  transition: "all 0.2s",
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ color: "var(--foreground)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Welcome, {name}! 🌟
              </h2>
              <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
                When is your exam? (If unsure, I&apos;ll set it 15 days from today)
              </p>

              <div className="mb-4">
                <label style={{ color: "var(--muted)", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>
                  Exam Date (optional)
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "var(--secondary)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "10px",
                    color: "var(--foreground)",
                    fontSize: "1rem",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                />
              </div>

              {/* Exam Info */}
              <div
                className="rounded-xl p-4 mb-6"
                style={{ background: "var(--secondary)", border: "1px solid var(--card-border)" }}
              >
                <p style={{ color: "var(--green)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  📋 FGEI BPS-15 Assistant Exam Pattern
                </p>
                {[
                  ["Questions", "100 MCQs"],
                  ["Duration", "90 Minutes"],
                  ["Negative Marking", "None"],
                  ["Subjects", "7 (English, GK, Math/IQ, Pak Studies, Islamic, Computer, CA)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between" style={{ fontSize: "0.8rem", marginBottom: "3px" }}>
                    <span style={{ color: "var(--muted)" }}>{k}:</span>
                    <span style={{ color: "var(--foreground)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, var(--primary), var(--green))",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🚀 Start My 15-Day Prep Plan!
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center mt-4" style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
          All data is saved locally in your browser. No account needed.
        </p>
      </div>
    </div>
  );
}
