// localStorage-based diagram history. Client-side only.
const KEY = "ai-diagram-history";
const MAX = 30;

export function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveToHistory(diagram, prompt) {
  if (typeof window === "undefined") return loadHistory();
  const list = loadHistory();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    at: Date.now(),
    title: diagram.title || "Untitled",
    kind: diagram.kind,
    prompt: prompt || "",
    diagram,
  };
  const next = [entry, ...list].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteFromHistory(id) {
  const next = loadHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  localStorage.removeItem(KEY);
  return [];
}
