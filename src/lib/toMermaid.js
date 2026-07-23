// flow JSON (nodes + edges) ko Mermaid flowchart syntax mein convert karta hai.
// node.kind ke hisaab se shape choose karte hain:
//   start/end -> ([rounded])   decision -> {diamond}   io -> [/parallelogram/]   process -> [rectangle]

function shape(node) {
  const label = sanitize(node.label);
  switch (node.kind) {
    case "start":
    case "end":
      return `([${label}])`;
    case "decision":
      return `{${label}}`;
    case "io":
      return `[/${label}/]`;
    default:
      return `["${label}"]`;
  }
}

// Mermaid ko break karne wale characters se bacho
function sanitize(s) {
  return String(s).replace(/["{}[\]()]/g, " ").replace(/\s+/g, " ").trim();
}

export function flowToMermaid(flow) {
  const dir = flow.direction === "LR" ? "LR" : "TD";
  const lines = [`flowchart ${dir}`];

  for (const n of flow.nodes) {
    lines.push(`  ${n.id}${shape(n)}`);
  }
  for (const e of flow.edges) {
    const arrow = e.label ? `-- ${sanitize(e.label)} -->` : "-->";
    lines.push(`  ${e.from} ${arrow} ${e.to}`);
  }
  return lines.join("\n");
}
