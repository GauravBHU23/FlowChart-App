import { diagramSchema } from "@/lib/schema";
import { callLLM, stripFences, whichProvider } from "@/lib/generateDiagram";

export const runtime = "edge";

export async function POST(req) {
  if (!whichProvider()) {
    return Response.json(
      {
        error:
          "No API key configured. Set GEMINI_API_KEY (free) or ANTHROPIC_API_KEY in your environment variables.",
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
      { error: "Please enter a description to generate a diagram." },
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
      // no point retrying auth/quota errors — return a clear message immediately
      const msg = lastError.toLowerCase();
      if (msg.includes("api key") || msg.includes("api_key") || msg.includes("permission")) {
        return Response.json(
          { error: "Invalid API key. Please check your API key configuration." },
          { status: 401 }
        );
      }
      if (msg.includes("quota") || msg.includes("rate") || msg.includes("credit") || msg.includes("balance")) {
        return Response.json(
          {
            error:
              "Daily free limit reached or rate limited. Please try again in a little while, or add a fresh API key.",
          },
          { status: 429 }
        );
      }
    }
  }

  return Response.json(
    { error: "Could not generate the diagram. Please try again.", detail: lastError },
    { status: 502 }
  );
}
