"use client";

import { AppView, UserProfile } from "@/lib/types";
import { SUBJECTS, FIFTEEN_DAY_PLAN } from "@/lib/subjects";
import { Storage } from "@/lib/storage";

interface Props {
  profile: UserProfile;
  onNavigate: (v: AppView) => void;
}

const MOTIVATIONAL_QUOTES = [
  "Every expert was once a beginner. Start today!",
  "Success is the sum of small efforts repeated daily.",
  "Your future depends on what you do today. — Mahatma Gandhi",
  "Hustle in silence, let your success make the noise.",
  "Iqra — Read! The first word revealed to the Prophet. Keep reading.",
  "Hard work beats talent when talent doesn't work hard.",
  "The secret of getting ahead is getting started.",
];

export default function HomeView({ profile, onNavigate }: Props) {
  const todayPlan = FIFTEEN_DAY_PLAN[profile.current_day - 1];
  const quote = MOTIVATIONAL_QUOTES[profile.current_day % MOTIVATIONAL_QUOTES.length];
  const attempts = Storage.getTestAttempts();
  const latestAttempt = attempts[0];
  const weakTopics = Storage.getWeakTopics().slice(0, 4);
  const daysLeft = 15 - profile.current_day + 1;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Hero Greeting */}
      <div
        className="rounded-2xl p-6 mb-6 fade-in"
        style={{
          background: "linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.1))",
          border: "1px solid var(--card-border)",
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", marginBottom: "0.3rem" }}>
              Assalam o Alaikum, {profile.name}! 👋
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              {daysLeft > 0 ? `${daysLeft} days left until your exam. Let&apos;s make every second count.` : "Today is the day! You've got this! 💪"}
            </p>
            <p style={{ color: "var(--yellow)", fontSize: "0.85rem", fontStyle: "italic" }}>
              &quot;{quote}&quot;
            </p>
          </div>
          <div className="text-right">
            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)" }}>
              {profile.current_day}
              <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/15</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Day of Plan</p>
          </div>
        </div>
      </div>

      {/* Today's Plan Card */}
      {todayPlan && (
        <div
          className="rounded-2xl p-5 mb-6 fade-in"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                TODAY&apos;S MISSION — DAY {todayPlan.day}
              </p>
              <h2 style={{ color: "var(--foreground)", fontSize: "1.2rem", fontWeight: 700 }}>
                {todayPlan.title}
              </h2>
              {todayPlan.mcq_count > 0 && (
                <p style={{ color: "var(--primary)", fontSize: "0.85rem", marginTop: "4px" }}>
                  {todayPlan.mcq_count} MCQs ready for you
                </p>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {todayPlan.focus !== "interview" && todayPlan.focus !== "revision" && (
                <button
                  onClick={() => onNavigate("study")}
                  style={{
                    padding: "10px 20px",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  📚 Start Studying
                </button>
              )}
              {todayPlan.focus === "mock" && (
                <button
                  onClick={() => onNavigate("mock")}
                  style={{
                    padding: "10px 20px",
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  📝 Mock Exam
                </button>
              )}
              {todayPlan.focus === "interview" && (
                <button
                  onClick={() => onNavigate("interview")}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #ff9500, #e94560)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🎤 Interview Practice
                </button>
              )}
              {todayPlan.has_test && (
                <button
                  onClick={() => onNavigate("test")}
                  style={{
                    padding: "10px 20px",
                    background: "var(--green)",
                    color: "#111",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Take Test
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "MCQs Done", value: profile.total_mcqs_done, icon: "📝", color: "var(--primary)" },
          { label: "Accuracy", value: `${profile.overall_accuracy}%`, icon: "🎯", color: "var(--green)" },
          { label: "Day Streak", value: `${Storage.getStreak()} 🔥`, icon: "🔥", color: "var(--yellow)" },
          { label: "Tests Taken", value: attempts.length, icon: "📊", color: "var(--accent)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center fade-in"
            style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <h3 style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>
            ⚡ Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { label: "Study Mode — Flashcards", icon: "🃏", view: "study" as AppView, color: "var(--primary)" },
              { label: "Subject-wise Test", icon: "✏️", view: "test" as AppView, color: "var(--green)" },
              { label: "Full Mock Exam (100 MCQs)", icon: "📝", view: "mock" as AppView, color: "var(--accent)" },
              { label: "Interview Practice", icon: "🎤", view: "interview" as AppView, color: "#ff9500" },
              { label: "Progress Dashboard", icon: "📈", view: "dashboard" as AppView, color: "var(--yellow)" },
            ].map((action) => (
              <button
                key={action.view}
                onClick={() => onNavigate(action.view)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--card-border)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--card-border)";
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{action.icon}</span>
                <span style={{ fontWeight: 500 }}>{action.label}</span>
                <span style={{ marginLeft: "auto", color: "var(--muted)" }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Subject Weightage */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <h3 style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>
            📊 Subject Weightage (100 MCQs)
          </h3>
          <div className="space-y-2.5">
            {SUBJECTS.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: "0.8rem", color: "var(--foreground)" }}>
                    {s.icon} {s.name}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: s.color, fontWeight: 600 }}>
                    {s.weightage}% (~{Math.round(s.weightage)} MCQs)
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${s.weightage}%`,
                      background: s.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Test Result */}
      {latestAttempt && (
        <div
          className="mt-6 rounded-2xl p-5 fade-in"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
        >
          <h3 style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>
            📋 Last Test Result
          </h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background:
                  latestAttempt.score / latestAttempt.total >= 0.8
                    ? "var(--green)"
                    : latestAttempt.score / latestAttempt.total >= 0.5
                    ? "var(--yellow)"
                    : "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                flexDirection: "column",
              }}
            >
              <span style={{ color: "#111", fontWeight: 800, fontSize: "1.1rem" }}>
                {Math.round((latestAttempt.score / latestAttempt.total) * 100)}%
              </span>
            </div>
            <div className="flex-1">
              <p style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "0.9rem" }}>
                {latestAttempt.subject_name} — {latestAttempt.score}/{latestAttempt.total}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "4px" }}>
                {new Date(latestAttempt.attempted_at).toLocaleDateString()}
              </p>
              {latestAttempt.weak_topics.length > 0 && (
                <p style={{ color: "var(--accent)", fontSize: "0.78rem", marginTop: "4px" }}>
                  ⚠️ Weak: {latestAttempt.weak_topics.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div
          className="mt-6 rounded-2xl p-5 fade-in"
          style={{ background: "rgba(233,69,96,0.08)", border: "1px solid rgba(233,69,96,0.3)" }}
        >
          <h3 style={{ color: "var(--accent)", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem" }}>
            ⚠️ Focus Areas — Weak Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <span
                key={t}
                style={{
                  padding: "4px 12px",
                  background: "rgba(233,69,96,0.15)",
                  border: "1px solid rgba(233,69,96,0.4)",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  color: "var(--accent)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
