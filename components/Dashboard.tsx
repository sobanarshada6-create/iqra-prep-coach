"use client";

import { useState, useEffect } from "react";
import { UserProfile, AppView, Progress } from "@/lib/types";
import { SUBJECTS, FIFTEEN_DAY_PLAN } from "@/lib/subjects";
import { Storage } from "@/lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

interface Props {
  profile: UserProfile;
  onNavigate: (v: AppView) => void;
}

export default function Dashboard({ profile, onNavigate }: Props) {
  const [attempts, setAttempts] = useState(Storage.getTestAttempts());
  const [weakTopics, setWeakTopics] = useState(Storage.getWeakTopics());
  const [interviewSessions, setInterviewSessions] = useState(Storage.getInterviewSessions());
  const [activeTab, setActiveTab] = useState<"overview" | "tests" | "plan" | "interview">("overview");

  useEffect(() => {
    setAttempts(Storage.getTestAttempts());
    setWeakTopics(Storage.getWeakTopics());
    setInterviewSessions(Storage.getInterviewSessions());
  }, []);

  const subjectStats = SUBJECTS.map((s) => {
    const subAttempts = attempts.filter((a) => a.subject_id === s.id);
    const avg = subAttempts.length > 0
      ? Math.round(subAttempts.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) / subAttempts.length)
      : 0;
    return { name: s.name.split(" ")[0], accuracy: avg, color: s.color, attempts: subAttempts.length };
  });

  const accuracyTrend = attempts.slice(0, 10).reverse().map((a, i) => ({
    label: `T${i + 1}`,
    accuracy: Math.round((a.score / a.total) * 100),
    subject: a.subject_name,
  }));

  const totalMCQs = attempts.reduce((a, b) => a + b.total, 0);
  const avgAccuracy = attempts.length > 0
    ? Math.round(attempts.reduce((a, b) => a + (b.score / b.total) * 100, 0) / attempts.length)
    : 0;
  const bestSubject = subjectStats.sort((a, b) => b.accuracy - a.accuracy)[0];
  const worstSubject = subjectStats.filter((s) => s.accuracy > 0).sort((a, b) => a.accuracy - b.accuracy)[0];

  const TAB_STYLE = (active: boolean) => ({
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: active ? "var(--primary)" : "var(--secondary)",
    color: active ? "#fff" : "var(--muted)",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: active ? 700 : 400,
    transition: "all 0.2s",
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 style={{ color: "var(--foreground)", fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.3rem" }}>
            📊 My Progress Dashboard
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Day {profile.current_day} of 15 &nbsp;·&nbsp; {15 - profile.current_day} days remaining
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["overview", "tests", "plan", "interview"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={TAB_STYLE(activeTab === tab)}>
              {tab === "overview" ? "📈 Overview" : tab === "tests" ? "📝 Tests" : tab === "plan" ? "📅 15-Day Plan" : "🎤 Interview"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "MCQs Practiced", value: totalMCQs || profile.total_mcqs_done, icon: "📝", color: "var(--primary)" },
          { label: "Avg Accuracy", value: `${avgAccuracy || profile.overall_accuracy}%`, icon: "🎯", color: "var(--green)" },
          { label: "Tests Taken", value: attempts.length, icon: "✏️", color: "var(--yellow)" },
          { label: "Day Streak", value: `${Storage.getStreak()}🔥`, icon: "🔥", color: "var(--accent)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center fade-in" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{s.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Subject Accuracy Bar Chart */}
          {attempts.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>
                📊 Subject-wise Accuracy
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectStats.filter((s) => s.accuracy > 0)}>
                  <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 8 }}
                    labelStyle={{ color: "var(--foreground)" }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                  />
                  <Bar dataKey="accuracy" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Accuracy Trend */}
          {accuracyTrend.length >= 2 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>
                📈 Accuracy Trend (Last 10 Tests)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 8 }}
                    formatter={(v) => [`${v}%`, "Accuracy"]}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="var(--green)" strokeWidth={2} dot={{ fill: "var(--green)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best / Worst */}
          {bestSubject?.accuracy > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl p-5" style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.3)" }}>
                <p style={{ color: "var(--green)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "4px" }}>🌟 Strongest Subject</p>
                <p style={{ color: "var(--foreground)", fontSize: "1.2rem", fontWeight: 800 }}>{bestSubject.name}</p>
                <p style={{ color: "var(--green)", fontSize: "0.9rem" }}>{bestSubject.accuracy}% accuracy</p>
              </div>
              {worstSubject && (
                <div className="rounded-2xl p-5" style={{ background: "rgba(233,69,96,0.08)", border: "1px solid rgba(233,69,96,0.3)" }}>
                  <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "4px" }}>⚠️ Needs Work</p>
                  <p style={{ color: "var(--foreground)", fontSize: "1.2rem", fontWeight: 800 }}>{worstSubject.name}</p>
                  <p style={{ color: "var(--accent)", fontSize: "0.9rem" }}>{worstSubject.accuracy}% accuracy</p>
                </div>
              )}
            </div>
          )}

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                ⚠️ Weak Topics ({weakTopics.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {weakTopics.map((t) => (
                  <span key={t} style={{ padding: "5px 12px", background: "rgba(233,69,96,0.12)", border: "1px solid rgba(233,69,96,0.3)", borderRadius: "20px", fontSize: "0.8rem", color: "var(--accent)" }}>
                    {t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onNavigate("study")}
                style={{ marginTop: "1rem", padding: "8px 16px", background: "var(--accent)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
              >
                📚 Practice Weak Topics
              </button>
            </div>
          )}

          {attempts.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📊</div>
              <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "0.5rem" }}>No tests taken yet</p>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Take your first test to see stats here</p>
              <button onClick={() => onNavigate("test")} style={{ padding: "10px 24px", background: "var(--primary)", border: "none", borderRadius: "10px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                Start a Test
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "tests" && (
        <div className="space-y-3">
          {attempts.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <p style={{ color: "var(--muted)" }}>No tests taken yet</p>
            </div>
          ) : (
            attempts.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              const mins = Math.floor(a.time_taken / 60);
              const secs = a.time_taken % 60;
              return (
                <div key={a.id} className="rounded-xl p-4 flex items-center gap-4 flex-wrap" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
                    background: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--yellow)" : "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "0.85rem", color: "#111",
                  }}>
                    {pct}%
                  </div>
                  <div className="flex-1">
                    <p style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "0.9rem" }}>{a.subject_name}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
                      {a.score}/{a.total} correct &nbsp;·&nbsp; {mins}m {secs}s &nbsp;·&nbsp; {new Date(a.attempted_at).toLocaleDateString()}
                    </p>
                  </div>
                  {a.weak_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {a.weak_topics.slice(0, 2).map((t) => (
                        <span key={t} style={{ padding: "2px 8px", background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.3)", borderRadius: "12px", fontSize: "0.7rem", color: "var(--accent)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "plan" && (
        <div className="space-y-2">
          {FIFTEEN_DAY_PLAN.map((day) => {
            const isDone = day.day < profile.current_day;
            const isToday = day.day === profile.current_day;
            const dayAttempts = attempts.filter((a) => a.attempted_at.startsWith(new Date(Date.now() - (profile.current_day - day.day) * 86400000).toISOString().split("T")[0]));
            return (
              <div key={day.day} className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: isToday ? "rgba(108,99,255,0.1)" : "var(--card)",
                  border: `1px solid ${isToday ? "rgba(108,99,255,0.4)" : "var(--card-border)"}`,
                }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? "var(--green)" : isToday ? "var(--primary)" : "var(--secondary)", fontSize: "0.85rem", fontWeight: 700, color: isDone || isToday ? "#fff" : "var(--muted)" }}>
                  {isDone ? "✓" : isToday ? "▶" : day.day}
                </div>
                <div className="flex-1">
                  <p style={{ color: isDone ? "var(--green)" : isToday ? "var(--primary)" : "var(--foreground)", fontWeight: isToday ? 700 : 500, fontSize: "0.88rem" }}>
                    Day {day.day}: {day.title}
                  </p>
                  {day.mcq_count > 0 && (
                    <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{day.mcq_count} MCQs</p>
                  )}
                </div>
                {isToday && (
                  <span style={{ padding: "3px 10px", background: "var(--primary)", borderRadius: "12px", fontSize: "0.72rem", color: "#fff", fontWeight: 600 }}>TODAY</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "interview" && (
        <div className="space-y-4">
          {interviewSessions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎤</div>
              <p style={{ color: "var(--foreground)", fontWeight: 700, marginBottom: "0.5rem" }}>No interview sessions yet</p>
              <button onClick={() => onNavigate("interview")} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #ff9500, var(--accent))", border: "none", borderRadius: "10px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                Start Interview Practice
              </button>
            </div>
          ) : (
            interviewSessions.map((s) => (
              <div key={s.id} className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-center gap-4">
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: s.overall_score >= 75 ? "var(--green)" : s.overall_score >= 50 ? "var(--yellow)" : "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", color: "#111", flexShrink: 0 }}>
                    {s.overall_score}
                  </div>
                  <div>
                    <p style={{ color: "var(--foreground)", fontWeight: 700 }}>Interview Score: {s.overall_score}/100</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{new Date(s.created_at).toLocaleDateString()}</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.78rem" }}>{s.transcript.length} exchanges</p>
                  </div>
                </div>
                {s.tips.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--card-border)" }}>
                    <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>TOP TIPS:</p>
                    {s.tips.slice(0, 2).map((t, i) => (
                      <p key={i} style={{ color: "var(--foreground)", fontSize: "0.8rem", marginBottom: "3px" }}>• {t}</p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
