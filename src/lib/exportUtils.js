"use client";

import { toPng } from "html-to-image";

function download(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// PNG export of any DOM node
export async function exportPng(node, filename, bg = "#070b14") {
  const url = await toPng(node, { backgroundColor: bg, pixelRatio: 2 });
  download(url, filename.endsWith(".png") ? filename : filename + ".png");
}

// SVG export — works when the node contains an <svg> (mermaid diagrams).
export function exportSvg(node, filename) {
  const svg = node.querySelector("svg");
  if (!svg) throw new Error("This view has no SVG to export (try PNG).");
  const clone = svg.cloneNode(true);
  // ensure xmlns for standalone file
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const src = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  download(url, filename.endsWith(".svg") ? filename : filename + ".svg");
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

// diagram -> the "source code" a user can copy/edit
export function diagramToSource(diagram, flowToMermaid) {
  if (diagram.kind === "mermaid") return diagram.code;
  if (diagram.kind === "flow") return flowToMermaid(diagram);
  if (diagram.kind === "chart") return JSON.stringify(diagram, null, 2);
  return "";
}
