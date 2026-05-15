import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai-client";

const INTERVIEW_SYSTEM = `You are the chair of an FGEI (Federal Government Educational Institutions) interview panel for the BPS-15 Assistant post.

Your job: Conduct a realistic 10-minute mock interview covering:
1. One HR/personal question
2. One Pakistan current affairs question  
3. One English language question
4. One Islamic Studies/ethics question
5. One situational/administrative question

Rules:
- Ask ONE question at a time
- After each answer, give a brief score (X/10) and one-line feedback
- Ask natural follow-ups if the answer is incomplete
- Be professional but not intimidating
- After 5 questions, give overall feedback with 5 specific tips
- Use formal language but occasionally acknowledge good answers warmly

Start by introducing yourself and asking the first HR question.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, phase } = await req.json();

    if (phase === "start") {
      const reply = await aiChat(
        [{ role: "user", content: "Start the interview. Introduce yourself briefly and ask the first question." }],
        INTERVIEW_SYSTEM,
        600
      );
      return NextResponse.json({ reply, phase: "ongoing" });
    }

    if (phase === "ongoing") {
      const formattedMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      const reply = await aiChat(formattedMessages, INTERVIEW_SYSTEM, 800);
      const isEnding = reply.toLowerCase().includes("overall feedback") || reply.toLowerCase().includes("interview is now complete") || reply.toLowerCase().includes("5 tips");
      return NextResponse.json({ reply, phase: isEnding ? "ended" : "ongoing" });
    }

    if (phase === "score") {
      const transcript = messages.map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

      const scorePrompt = `Based on this interview transcript, provide:
1. Overall score out of 100
2. Score breakdown: Communication (X/25), Content Knowledge (X/25), Confidence (X/25), Professionalism (X/25)
3. Top 5 improvement tips

Transcript:
${transcript}

Return as JSON:
{
  "overall_score": 75,
  "breakdown": {"communication": 18, "knowledge": 20, "confidence": 17, "professionalism": 20},
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
}`;

      const raw = await aiChat([{ role: "user", content: scorePrompt }], undefined, 500);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall_score: 70, tips: [] };

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  } catch (error) {
    console.error("Interview API Error:", error);
    return NextResponse.json({ error: "Interview failed", details: String(error) }, { status: 500 });
  }
}
