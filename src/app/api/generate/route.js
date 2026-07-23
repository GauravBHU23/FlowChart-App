import { diagramSchema } from "@/lib/schema";
import { callLLM, stripFences, whichProvider } from "@/lib/generateDiagram";

export const runtime = "edge";

export async function POST(req) {
  if (!whichProvider()) {
    return Response.json(
      {
        error:
          "Koi API key set nahi hai. .env.local mein GEMINI_API_KEY (free) ya ANTHROPIC_API_KEY daalo aur dev server restart karo.",
      },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userText = (body?.text || "").toString().trim();
  if (!userText) {
    return Response.json(
      { error: "Kuch text likho jisse diagram banana hai." },
      { status: 400 }
    );
  }

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callLLM(userText, attempt);
      const parsed = JSON.parse(stripFences(raw));
      const result = diagramSchema.safeParse(parsed);
      if (!result.success) {
        lastError = result.error.message;
        continue;
      }
      return Response.json({ diagram: result.data });
    } catch (err) {
      lastError = err?.message || String(err);
      // auth/quota jaise errors pe retry ka fayda nahi — turant saaf message do
      const msg = lastError.toLowerCase();
      if (msg.includes("api key") || msg.includes("api_key") || msg.includes("permission")) {
        return Response.json(
          { error: "API key galat ya invalid hai. Sahi key .env.local mein daalo." },
          { status: 401 }
        );
      }
      if (msg.includes("quota") || msg.includes("rate") || msg.includes("credit") || msg.includes("balance")) {
        return Response.json(
          { error: "Quota/credit khatam ya rate limit. Thodi der baad ya doosri key se try karo." },
          { status: 429 }
        );
      }
    }
  }

  return Response.json(
    { error: "Diagram generate nahi ho paya.", detail: lastError },
    { status: 502 }
  );
}
