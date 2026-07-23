import { z } from "zod";

// Teen broad output types:
// 1. "flow"    -> structured nodes+edges (2D Mermaid + 3D dono render kar sakte)
// 2. "mermaid" -> raw Mermaid code (sequence, gantt, ER, class, state, mindmap,
//                 timeline, journey, gitgraph, etc.) — jo bhi Mermaid support kare
// 3. "chart"   -> data-based (bar/line/pie/area/scatter/radar/donut/stacked/hbar)

export const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["start", "end", "decision", "process", "io"]).optional(),
});

export const edgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
});

// Structured flow (nodes+edges) — 2D + 3D dono ke liye
export const flowSchema = z.object({
  kind: z.literal("flow"),
  title: z.string(),
  direction: z.enum(["TD", "LR"]).default("TD"),
  nodes: z.array(nodeSchema).min(1),
  edges: z.array(edgeSchema),
});

// Raw Mermaid — sabse flexible. Ye har wo diagram cover karta hai jo flow nahi hai.
export const mermaidSchema = z.object({
  kind: z.literal("mermaid"),
  title: z.string(),
  // konsa mermaid diagram hai (UI badge + hint ke liye)
  diagramType: z
    .enum([
      "sequence",
      "gantt",
      "er",
      "class",
      "state",
      "mindmap",
      "timeline",
      "journey",
      "gitgraph",
      "pie",
      "quadrant",
      "requirement",
      "other",
    ])
    .default("other"),
  // pura valid mermaid code
  code: z.string().min(1),
});

export const chartSchema = z.object({
  kind: z.literal("chart"),
  title: z.string(),
  chartType: z.enum([
    "bar",
    "line",
    "area",
    "pie",
    "donut",
    "scatter",
    "radar",
    "stacked-bar",
    "horizontal-bar",
  ]),
  data: z
    .array(z.record(z.string(), z.union([z.string(), z.number()])))
    .min(1),
  categoryKey: z.string(),
  valueKeys: z.array(z.string()).min(1),
});

export const diagramSchema = z.discriminatedUnion("kind", [
  flowSchema,
  mermaidSchema,
  chartSchema,
]);
