export interface Subject {
  id: string;
  name: string;
  weightage: number;
  color: string;
  icon: string;
  topics: string[];
}

export interface MCQ {
  id: string;
  subject_id: string;
  subject_name: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  served_at?: string;
}

export interface TestAttempt {
  id: string;
  subject_id: string;
  subject_name: string;
  mcqs: MCQ[];
  answers: Record<string, string>;
  score: number;
  total: number;
  time_taken: number;
  feedback: string;
  weak_topics: string[];
  attempted_at: string;
}

export interface DailySet {
  id: string;
  date: string;
  day_number: number;
  subject_focus: string;
  mcqs: MCQ[];
  status: "pending" | "in_progress" | "completed";
}

export interface Progress {
  day_number: number;
  date: string;
  subjects_covered: string[];
  accuracy: Record<string, number>;
  weak_topics: string[];
  total_mcqs_done: number;
  tests_taken: number;
}

export interface InterviewSession {
  id: string;
  transcript: Array<{ role: "interviewer" | "candidate"; content: string; score?: number }>;
  overall_score: number;
  tips: string[];
  created_at: string;
}

export interface UserProfile {
  name: string;
  exam_date: string;
  current_day: number;
  total_mcqs_done: number;
  overall_accuracy: number;
  streak: number;
  weak_topics: string[];
}

export type AppView = "home" | "study" | "test" | "mock" | "interview" | "dashboard" | "settings";

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
}
