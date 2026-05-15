import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai-client";
import { SUBJECTS } from "@/lib/subjects";

export async function POST(req: NextRequest) {
  try {
    const { subject_id, count = 20, difficulty_mix, served_topics = [], day_number = 1 } = await req.json();

    const subject = SUBJECTS.find((s) => s.id === subject_id);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 400 });

    const topicsStr = subject.topics.join(", ");
    const avoidStr = served_topics.length > 0
      ? `\nAvoid these already-covered topics: ${served_topics.join(", ")}`
      : "";
    const difficultyNote = difficulty_mix || "40% easy, 40% medium, 20% hard";

    const prompt = `You are an expert exam paper setter for FGEI BPS-15 Assistant competitive exam in Pakistan.

Generate exactly ${count} multiple-choice questions for subject: ${subject.name}
Topics to cover: ${topicsStr}
Difficulty mix: ${difficultyNote}
Day ${day_number} of 15-day prep plan.${avoidStr}

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- One correct answer only
- Questions must be factually accurate about Pakistan
- For Current Affairs: focus on last 6 months Pakistan & world events
- For Math/IQ: include actual numbers and calculations
- Explanations must be 2-3 lines, educational

IMPORTANT: Return ONLY a raw JSON array. No markdown fences, no explanation text. Start directly with [
[
  {
    "id": "mcq_1",
    "subject_id": "${subject_id}",
    "subject_name": "${subject.name}",
    "question": "Question text?",
    "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
    "correct_answer": "A",
    "explanation": "Explanation here.",
    "difficulty": "easy",
    "topic": "${subject.topics[0]}"
  }
]`;

    const rawText = await aiChat(
      [{ role: "user", content: prompt }],
      undefined,
      4000
    );

    // Extract JSON array from response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI did not return valid JSON. Try again.", raw: rawText.slice(0, 300) },
        { status: 500 }
      );
    }

    const mcqs = JSON.parse(jsonMatch[0]);

    const finalMcqs = mcqs.map((mcq: Record<string, unknown>, idx: number) => ({
      ...mcq,
      id: `${subject_id}_d${day_number}_${idx}_${Date.now()}`,
      served_at: new Date().toISOString(),
    }));

    return NextResponse.json({ mcqs: finalMcqs, count: finalMcqs.length });
  } catch (error) {
    console.error("MCQ Generation Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
