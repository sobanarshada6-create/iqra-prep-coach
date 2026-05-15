/**
 * AI Client — uses FREE APIs only:
 * Primary:  Groq (llama-3.3-70b-versatile) — https://console.groq.com  — no credit card
 * Fallback: Google Gemini (gemini-1.5-flash) — https://aistudio.google.com — no credit card
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Call Groq first, fall back to Gemini if Groq key missing or rate-limited.
 */
export async function aiChat(
  messages: ChatMessage[],
  systemPrompt?: string,
  maxTokens = 2000
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // ── GROQ ─────────────────────────────────────────────────────────────────
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) groqMessages.push({ role: "system", content: systemPrompt });
      messages.forEach((m) => {
        if (m.role !== "system") groqMessages.push({ role: m.role, content: m.content });
      });

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
      });
      return completion.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.warn("Groq failed, trying Gemini:", err);
    }
  }

  // ── GEMINI ────────────────────────────────────────────────────────────────
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Build combined prompt
      const fullPrompt = [
        systemPrompt ? `SYSTEM: ${systemPrompt}` : "",
        ...messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`),
      ]
        .filter(Boolean)
        .join("\n\n");

      const result = await model.generateContent(fullPrompt);
      return result.response.text();
    } catch (err) {
      console.warn("Gemini also failed:", err);
    }
  }

  throw new Error(
    "No AI API key configured. Please add GROQ_API_KEY or GEMINI_API_KEY to your .env.local file.\n" +
      "Get free keys at:\n• Groq: https://console.groq.com\n• Gemini: https://aistudio.google.com"
  );
}
