"use client";

import { useState, useEffect } from "react";
import { Storage } from "@/lib/storage";
import { UserProfile, AppView } from "@/lib/types";
import OnboardingScreen from "./OnboardingScreen";
import Sidebar from "./Sidebar";
import HomeView from "./HomeView";
import StudyMode from "./StudyMode";
import TestMode from "./TestMode";
import MockExam from "./MockExam";
import InterviewCoach from "./InterviewCoach";
import Dashboard from "./Dashboard";
import ChatAssistant from "./ChatAssistant";

export default function AppShell() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<AppView>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = Storage.getUserProfile();
    setProfile(saved);
    Storage.updateStreak();
    setMounted(true);
  }, []);

  const handleOnboardingComplete = (p: UserProfile) => {
    Storage.saveUserProfile(p);
    setProfile(p);
  };

  // Not yet mounted — show nothing (avoids SSR/hydration mismatch)
  if (!mounted) {
    return (
      <div style={{ background: "var(--background)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎓</div>
          <p style={{ color: "var(--primary)", fontSize: "1.1rem", fontWeight: 600 }}>Iqra Prep Coach</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.4rem" }}>Preparing your 15-day study plan...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const renderView = () => {
    switch (view) {
      case "home":       return <HomeView profile={profile} onNavigate={setView} />;
      case "study":      return <StudyMode profile={profile} onNavigate={setView} />;
      case "test":       return <TestMode profile={profile} onNavigate={setView} />;
      case "mock":       return <MockExam profile={profile} onNavigate={setView} />;
      case "interview":  return <InterviewCoach profile={profile} onNavigate={setView} />;
      case "dashboard":  return <Dashboard profile={profile} onNavigate={setView} />;
      default:           return <HomeView profile={profile} onNavigate={setView} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <Sidebar
        profile={profile}
        currentView={view}
        onNavigate={setView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "280px" : "0" }}
      >
        {/* Top Bar */}
        <div
          className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--card-border)", height: "56px" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ background: "var(--card-border)", color: "var(--foreground)" }}
            >
              ☰
            </button>
            <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Day {profile.current_day} of 15
            </span>
            <div className="h-4 w-px" style={{ background: "var(--card-border)" }} />
            <span style={{ color: "var(--green)", fontSize: "0.85rem", fontWeight: 600 }}>
              🔥 {Storage.getStreak()} day streak
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Accuracy</span>
              <span
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
              >
                {profile.overall_accuracy}%
              </span>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#fff",
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-auto">{renderView()}</div>
      </div>

      {/* Floating Chat Assistant */}
      <ChatAssistant profile={profile} />
    </div>
  );
}
