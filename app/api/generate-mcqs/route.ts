import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai-client";
import { SUBJECTS } from "@/lib/subjects";

export async function POST(req: NextRequest) {
  try {
    const { subject_id, count = 10, difficulty_mix, served_topics = [], day_number = 1 } = await req.json();

    const subject = SUBJECTS.find((s) => s.id === subject_id);
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 400 });

    const topicsStr = subject.topics.join(", ");
    const avoidStr = served_topics.length > 0
      ? `\nAvoid these already-covered topics: ${served_topics.join(", ")}`
      : "";
    const difficultyNote = difficulty_mix || "40% easy, 40% medium, 20% hard";

    const prompt = `You are an expert exam paper setter for FGEI BPS-15 competitive exam in Pakistan.

Generate exactly ${count} multiple-choice questions for subject: ${subject.name}
Topics: ${topicsStr}
Difficulty: ${difficultyNote}
Day ${day_number} of 15-day prep plan.${avoidStr}

Rules:
- Each question must have exactly 4 options labeled A, B, C, D
- One correct answer only
- Questions must be factually accurate
- For Current Affairs: focus on recent Pakistan and world events
- For Math/IQ: include actual numbers and calculations
- Keep explanations short (1-2 sentences)

Return ONLY a valid JSON array with no extra text, no markdown, no code fences. The response must start with [ and end with ].

Each object must follow this exact structure:
{"id":"mcq_1","subject_id":"${subject_id}","subject_name":"${subject.name}","question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct_answer":"A","explanation":"...","difficulty":"easy","topic":"..."}

Generate all ${count} questions now:`;

    const rawText = await aiChat(
      [{ role: "user", content: prompt }],
      undefined,
      6000
    );

    // Extract JSON array from response
    // Clean the response - remove markdown fences if AI added them
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
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
