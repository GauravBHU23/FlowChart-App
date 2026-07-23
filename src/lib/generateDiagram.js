import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";

// Ye file edge-runtime safe hai — koi Node SDK use nahi hoti, sirf fetch().
// Isse Cloudflare Pages / Vercel Edge dono pe chalta hai.

export function stripFences(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return text;
}

export function whichProvider() {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

export async function callLLM(userText, attempt) {
  const provider = whichProvider();
  const correction =
    attempt > 0
      ? "\n\n(Previous output was not valid JSON. Return ONLY a valid JSON object, nothing else.)"
      : "";
  const userPrompt = buildUserPrompt(userText) + correction;

  if (provider === "gemini") {
    return callGemini(userPrompt);
  }
  if (provider === "claude") {
    return callClaude(userPrompt);
  }
  throw new Error("NO_PROVIDER");
}

// ---- Gemini via REST (edge-safe) ----
async function callGemini(userPrompt) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status} ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("");
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

// ---- Claude via REST (edge-safe) ----
async function callClaude(userPrompt) {
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const key = process.env.ANTHROPIC_API_KEY;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${res.status} ${errText}`);
  }
  const data = await res.json();
  const text = (data?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Empty response from Claude");
  return text;
}
