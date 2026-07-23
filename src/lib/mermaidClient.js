"use client";

import mermaid from "mermaid";

let currentTheme = "dark";

export function initMermaid(theme = "dark") {
  currentTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === "light" ? "default" : "dark",
    securityLevel: "loose",
    flowchart: { curve: "basis", useMaxWidth: true },
    sequence: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
    er: { useMaxWidth: true },
  });
}

// Render mermaid code -> { svg } ya throw. Ek unique id har baar.
export async function renderMermaid(code) {
  const id = "mmd-" + Math.random().toString(36).slice(2);
  const { svg } = await mermaid.render(id, code);
  return svg;
}

export function getMermaidTheme() {
  return currentTheme;
}
