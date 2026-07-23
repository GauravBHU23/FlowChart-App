// flow ke nodes ko 3D space mein position deta hai.
// BFS se "level" (depth) nikaalte hain -> level = Z axis (depth),
// same level ke nodes X axis pe spread hote hain, thoda Y variation ke saath.

export function layout3d(flow) {
  const { nodes, edges } = flow;
  const idToNode = new Map(nodes.map((n) => [n.id, n]));

  // adjacency
  const adj = new Map(nodes.map((n) => [n.id, []]));
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) {
    if (adj.has(e.from) && idToNode.has(e.to)) {
      adj.get(e.from).push(e.to);
      indeg.set(e.to, (indeg.get(e.to) || 0) + 1);
    }
  }

  // roots = indegree 0 (ya pehla node fallback)
  let roots = nodes.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id);
  if (roots.length === 0 && nodes.length) roots = [nodes[0].id];

  // BFS level assign
  const level = new Map();
  const queue = [];
  for (const r of roots) {
    level.set(r, 0);
    queue.push(r);
  }
  while (queue.length) {
    const cur = queue.shift();
    const l = level.get(cur);
    for (const nb of adj.get(cur) || []) {
      if (!level.has(nb)) {
        level.set(nb, l + 1);
        queue.push(nb);
      }
    }
  }
  // koi disconnected node reh gaya to use last level de do
  let maxL = 0;
  for (const v of level.values()) maxL = Math.max(maxL, v);
  for (const n of nodes) if (!level.has(n.id)) level.set(n.id, maxL);

  // group by level
  const byLevel = new Map();
  for (const n of nodes) {
    const l = level.get(n.id);
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l).push(n.id);
  }

  const GAP_X = 3.2;
  const GAP_Z = 3.6;
  const pos = new Map();
  for (const [l, ids] of byLevel) {
    const count = ids.length;
    ids.forEach((id, i) => {
      const x = (i - (count - 1) / 2) * GAP_X;
      const z = -l * GAP_Z;
      const y = (i % 2 === 0 ? 0.4 : -0.4) + (l % 2 ? 0.3 : 0); // halka sa 3D feel
      pos.set(id, [x, y, z]);
    });
  }

  const positionedNodes = nodes.map((n) => ({
    ...n,
    position: pos.get(n.id) || [0, 0, 0],
  }));
  const positionedEdges = edges
    .filter((e) => pos.has(e.from) && pos.has(e.to))
    .map((e) => ({ ...e, from3: pos.get(e.from), to3: pos.get(e.to) }));

  return { nodes: positionedNodes, edges: positionedEdges };
}

// node.kind -> color
export function nodeColor(kind) {
  switch (kind) {
    case "start":
      return "#10b981";
    case "end":
      return "#ef4444";
    case "decision":
      return "#f59e0b";
    case "io":
      return "#06b6d4";
    default:
      return "#6366f1";
  }
}
