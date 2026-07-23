"use client";

import { flowToMermaid } from "@/lib/toMermaid";
import MermaidView from "@/components/MermaidView";

// Flow object ko mermaid flowchart code mein convert karke render karta hai.
export default function Mermaid2D({ flow, theme = "dark" }) {
  const code = flowToMermaid(flow);
  return <MermaidView code={code} theme={theme} />;
}
