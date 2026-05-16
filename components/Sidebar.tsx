"use client";

import { AppView, UserProfile } from "@/lib/types";
import { FIFTEEN_DAY_PLAN } from "@/lib/subjects";

interface Props {
  profile: UserProfile;
  currentView: AppView;
  onNavigate: (v: AppView) => void;
  isOpen: boolean;
  isMobile?: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: string }> = [
  { view: "home",       label: "Home",           icon: "🏠" },
  { view: "study",      label: "Study Mode",     icon: "📚" },
  { view: "test",       label: "Subject Test",   icon: "✏️" },
  { view: "mock",       label: "Full Mock Exam", icon: "📝" },
  { view: "interview",  label: "Interview Coach",icon: "🎤" },
  { view: "dashboard",  label: "My Dashboard",   icon: "📊" },
];

export default function Sidebar({ profile, currentView, onNavigate, isOpen, isMobile, onToggle }: Props) {
  const today = FIFTEEN_DAY_PLAN[profile.current_day - 1];
  const progress = ((profile.current_day - 1) / 15) * 100;

  return (
    <div
      className="fixed left-0 top-0 h-full flex flex-col z-50 transition-transform duration-500 ease-out"
      style={{
        width: "280px",
        background: "linear-gradient(180deg, rgba(22,22,26,0.98) 0%, rgba(16,16,20,0.99) 100%)",
        borderRight: "1px solid rgba(108, 99, 255, 0.25)",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        boxShadow: isOpen ? "4px 0 30px rgba(0,0,0,0.5), 0 0 60px rgba(108,99,255,0.1)" : "none",
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "rgba(108, 99, 255, 0.2)" }}>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--green) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
                boxShadow: "0 4px 15px rgba(108,99,255,0.4)",
              }}
            >
              🎓
            </div>
            <div>
              <p style={{ color: "var(--foreground)", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>
                Iqra Prep Coach
              </p>
              <p style={{ color: "var(--green)", fontSize: "0.72rem", fontWeight: 500 }}>FGEI BPS-15 Assistant</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg transition-colors"
              style={{ background: "rgba(233,69,96,0.1)", color: "var(--accent)" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Today's Focus */}
      {today && (
        <div className="mx-3 mt-3 rounded-xl p-3" style={{ 
          background: "linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(0,212,170,0.05) 100%)", 
          border: "1px solid rgba(108, 99, 255, 0.3)",
          boxShadow: "0 4px 20px rgba(108,99,255,0.1)"
        }}>
          <p style={{ color: "var(--muted)", fontSize: "0.7rem", marginBottom: "4px", letterSpacing: "0.5px" }}>TODAY — DAY {profile.current_day}/15</p>
          <p style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem" }}>{today.title}</p>
          <div className="progress-bar mt-2" style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.1)" }}>
            <div className="progress-bar-fill" style={{ 
              width: `${progress}%`, 
              height: "100%", 
              borderRadius: "3px",
              background: "linear-gradient(90deg, var(--primary), var(--green))"
            }} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 mt-2">
        <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600, padding: "4px 8px", marginBottom: "4px" }}>
          MAIN MENU
        </p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200"
            style={{
              background: currentView === item.view ? "var(--primary)" : "transparent",
              color: currentView === item.view ? "#fff" : "var(--foreground)",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.88rem",
              fontWeight: currentView === item.view ? 600 : 400,
            }}
          >
            <span style={{ fontSize: "1rem" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        {/* 15-Day Plan mini-list */}
        <p style={{ color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600, padding: "12px 8px 4px" }}>
          15-DAY PLAN
        </p>
        <div className="space-y-1">
          {FIFTEEN_DAY_PLAN.map((day) => {
            const isDone = day.day < profile.current_day;
            const isToday = day.day === profile.current_day;
            return (
              <div
                key={day.day}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: isToday ? "rgba(108,99,255,0.15)" : "transparent",
                  border: isToday ? "1px solid rgba(108,99,255,0.3)" : "1px solid transparent",
                }}
              >
                <span style={{ fontSize: "0.75rem", width: 20, textAlign: "center" }}>
                  {isDone ? "✅" : isToday ? "▶️" : "⬜"}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: isDone ? "var(--green)" : isToday ? "var(--primary)" : "var(--muted)",
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  Day {day.day}: {day.title}
                </span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t" style={{ borderColor: "var(--card-border)" }}>
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#fff",
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: "var(--foreground)", fontWeight: 600, fontSize: "0.85rem" }}>{profile.name}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.72rem" }}>{profile.total_mcqs_done} MCQs done</p>
          </div>
          <span style={{ color: "var(--yellow)", fontSize: "0.85rem" }}>🔥{profile.streak}</span>
        </div>
      </div>
    </div>
  );
}
