import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai-client";
import { MCQ } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { mcqs, answers, subject_name, time_taken }: {
      mcqs: MCQ[];
      answers: Record<string, string>;
      subject_name: string;
      time_taken: number;
    } = await req.json();

    let score = 0;
    const wrong: Array<{ question: string; your_answer: string; correct: string; explanation: string; topic: string }> = [];

    mcqs.forEach((mcq) => {
      if (answers[mcq.id] === mcq.correct_answer) {
        score++;
      } else {
        wrong.push({
          question: mcq.question,
          your_answer: answers[mcq.id] || "Not answered",
          correct: `${mcq.correct_answer}: ${mcq.options[mcq.correct_answer as keyof typeof mcq.options]}`,
          explanation: mcq.explanation,
          topic: mcq.topic,
        });
      }
    });

    const percentage = Math.round((score / mcqs.length) * 100);
    const weakTopics = [...new Set(wrong.map((w) => w.topic))];

    const minutes = Math.floor(time_taken / 60);
    const seconds = time_taken % 60;
    const timeStr = `${minutes}m ${seconds}s`;

    const prompt = `You are a strict but encouraging exam coach for FGEI BPS-15 Assistant exam.

A student just completed a ${subject_name} test.
- Score: ${score}/${mcqs.length} (${percentage}%)
- Time taken: ${timeStr}
- Wrong questions: ${wrong.length}
- Weak topics: ${weakTopics.join(", ") || "None identified"}

Wrong answers summary:
${wrong
  .slice(0, 10)
  .map((w) => `- Topic: ${w.topic} | Wrong answer: ${w.your_answer}`)
  .join("\n")}

Write a personalized feedback paragraph (4-5 sentences) that:
1. Acknowledges the score with appropriate emotion (celebrate if >80%, encourage if 50-80%, motivate if <50%)
2. Points out the specific weak topics to focus on
3. Gives 3 specific study tips for improvement
4. Ends with a motivational line in Urdu (e.g. "Shabash! Aage barhte raho!")

Keep it warm, like an elder sister giving feedback. Be direct and specific.`;

    const feedback = await aiChat(
      [{ role: "user", content: prompt }],
      undefined,
      800
    );

    return NextResponse.json({
      score,
      total: mcqs.length,
      percentage,
      time_taken,
      feedback,
      wrong_answers: wrong,
      weak_topics: weakTopics,
    });
  } catch (error) {
    console.error("Grade Test Error:", error);
    return NextResponse.json({ error: "Failed to grade test", details: String(error) }, { status: 500 });
  }
}
