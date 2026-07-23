"use client";

import { useEffect, useRef, useState } from "react";
import { initMermaid, renderMermaid } from "@/lib/mermaidClient";

// Generic Mermaid renderer. Pass raw `code` and a `theme`.
// Re-renders on code OR theme change. Errors are shown inline (no crash).
export default function MermaidView({ code, theme = "dark" }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    initMermaid(theme);
    renderMermaid(code)
      .then((svg) => {
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Render failed");
      });
    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  if (error) {
    return (
      <div className="p-4 text-sm text-red-300">
        <p className="font-medium mb-1">Could not render this diagram.</p>
        <p className="text-red-400/80 text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid-out flex items-center justify-center p-4"
    />
  );
}
