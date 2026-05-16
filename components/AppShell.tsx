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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const saved = Storage.getUserProfile();
    setProfile(saved);
    Storage.updateStreak();
    setMounted(true);
    
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
    <div className="flex h-screen overflow-hidden relative" style={{ background: "var(--background)" }}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar
        profile={profile}
        currentView={view}
        onNavigate={setView}
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-500 ease-out"
        style={{ 
          marginLeft: sidebarOpen && !isMobile ? "280px" : "0",
        }}
      >
        {/* Top Bar */}
        <div
          className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0 backdrop-blur-md"
          style={{ 
            background: "rgba(22, 22, 26, 0.85)", 
            borderBottom: "1px solid rgba(108, 99, 255, 0.2)", 
            height: "60px",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ 
                background: "linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.1))", 
                color: "var(--foreground)",
                border: "1px solid rgba(108,99,255,0.3)"
              }}
            >
              {sidebarOpen ? "✕" : "☰"}
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
