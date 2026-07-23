"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Mermaid2D from "@/components/Mermaid2D";
import MermaidView from "@/components/MermaidView";
import ChartRenderer from "@/components/ChartRenderer";
import { flowToMermaid } from "@/lib/toMermaid";
import {
  exportPng,
  exportSvg,
  copyText,
  diagramToSource,
} from "@/lib/exportUtils";
import {
  loadHistory,
  saveToHistory,
  deleteFromHistory,
  clearHistory,
} from "@/lib/history";

const Flow3D = dynamic(() => import("@/components/Flow3D"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] grid place-items-center text-slate-500">
      Loading 3D scene…
    </div>
  ),
});

const EXAMPLES = [
  { icon: "🔐", title: "Login Flow", prompt: "Create a flowchart for a login process: user enters credentials, if valid go to dashboard, otherwise show an error and retry." },
  { icon: "📦", title: "Order Pipeline", prompt: "Online order flow: add to cart, checkout, payment, warehouse packing, shipping, and delivered." },
  { icon: "🔁", title: "Sequence (API)", prompt: "Sequence diagram of a login API: Client sends credentials to Server, Server validates with Database, returns token to Client." },
  { icon: "🗄️", title: "ER Diagram", prompt: "ER diagram for a blog: User has many Posts, Post has many Comments, User writes Comments." },
  { icon: "📅", title: "Gantt Chart", prompt: "Gantt chart for a website project: Design 5 days, Development 10 days, Testing 4 days, Launch 2 days." },
  { icon: "🧠", title: "Mind Map", prompt: "Mind map for digital marketing: SEO, Social Media, Email, Content, Paid Ads with sub-branches." },
  { icon: "🔀", title: "State Machine", prompt: "State diagram of an order: Pending, Paid, Shipped, Delivered, Cancelled with transitions." },
  { icon: "🏛️", title: "Class Diagram", prompt: "Class diagram: Animal base class with Dog and Cat subclasses, each with name and sound." },
  { icon: "📊", title: "Bar Chart", prompt: "Bar chart of last 6 months sales: Jan 120, Feb 150, Mar 90, Apr 200, May 170, Jun 240." },
  { icon: "🥧", title: "Donut Chart", prompt: "Donut chart of market share: Product A 45, Product B 30, Product C 15, Others 10." },
  { icon: "🕸️", title: "Radar Chart", prompt: "Radar chart comparing two phones on Battery, Camera, Speed, Price, Design (scores out of 100)." },
  { icon: "📈", title: "Multi-Line", prompt: "Line chart of revenue vs profit over Q1-Q4: revenue 100 140 180 220, profit 20 35 50 70." },
];

const FEATURES = [
  { icon: "🔀", label: "Flowcharts" },
  { icon: "🧊", label: "3D View" },
  { icon: "🔁", label: "Sequence / ER / Class" },
  { icon: "📅", label: "Gantt / Mind Map" },
  { icon: "📈", label: "9 Chart Types" },
  { icon: "💾", label: "Save & Export" },
];

const TYPE_LABEL = {
  flow: "Flowchart",
  chart: "Chart",
  mermaid: "Diagram",
};

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagram, setDiagram] = useState(null);
  const [view, setView] = useState("2d"); // 2d | 3d | chart | mermaid
  const [theme, setTheme] = useState("dark");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [overrideCode, setOverrideCode] = useState(null); // manually edited mermaid code
  const [toast, setToast] = useState(null);

  const stageRef = useRef(null);
  const outputRef = useRef(null);

  // load theme + history on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai-diagram-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    setHistory(loadHistory());
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ai-diagram-theme", next);
  }

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function generate(input) {
    const prompt = (input ?? text).trim();
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setEditing(false);
    setOverrideCode(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      const d = json.diagram;
      setDiagram(d);
      setView(defaultView(d));
      setHistory(saveToHistory(d, prompt));
      setTimeout(
        () => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch (e) {
      setError(e.message);
      setDiagram(null);
    } finally {
      setLoading(false);
    }
  }

  function defaultView(d) {
    if (d.kind === "chart") return "chart";
    if (d.kind === "mermaid") return "mermaid";
    return "2d";
  }

  function openHistoryItem(entry) {
    setDiagram(entry.diagram);
    setView(defaultView(entry.diagram));
    setOverrideCode(null);
    setEditing(false);
    setShowHistory(false);
    setError(null);
  }

  // ---- export / copy ----
  function currentSource() {
    return overrideCode ?? diagramToSource(diagram, flowToMermaid);
  }

  async function handleCopy() {
    try {
      await copyText(currentSource());
      flash("Code copied ✓");
    } catch {
      flash("Copy failed");
    }
  }

  async function handlePng() {
    try {
      await exportPng(
        stageRef.current,
        diagram?.title || "diagram",
        theme === "light" ? "#ffffff" : "#070b14"
      );
      flash("PNG downloaded ✓");
    } catch (e) {
      flash("Export failed");
    }
  }

  function handleSvg() {
    try {
      exportSvg(stageRef.current, diagram?.title || "diagram");
      flash("SVG downloaded ✓");
    } catch (e) {
      flash(e.message || "SVG not available for this view");
    }
  }

  // ---- editing ----
  function startEdit() {
    setEditCode(currentSource());
    setEditing(true);
  }
  function applyEdit() {
    // for flow/mermaid we treat the edited text as mermaid code override
    if (diagram.kind === "chart") {
      try {
        const parsed = JSON.parse(editCode);
        setDiagram(parsed);
        setOverrideCode(null);
      } catch {
        flash("Invalid chart JSON");
        return;
      }
    } else {
      setOverrideCode(editCode);
      if (view === "3d") setView("2d"); // manual edits render via mermaid
    }
    setEditing(false);
    flash("Applied ✓");
  }

  const isFlow = diagram?.kind === "flow";
  const isChart = diagram?.kind === "chart";
  const isMermaid = diagram?.kind === "mermaid";
  const canEdit = !!diagram;
  const svgAvailable = view === "2d" || view === "mermaid";

  return (
    <main className="min-h-screen">
      {/* toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm border border-slate-700 shadow-xl animate-fade-up">
          {toast}
        </div>
      )}

      {/* ===== nav ===== */}
      <nav className="sticky top-0 z-30 backdrop-blur-md bg-[var(--bg)]/80 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold">
              ◆
            </span>
            <span className="font-semibold tracking-tight">AI Diagram Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] hover:border-indigo-500/50 transition flex items-center gap-1.5"
            >
              🕘 <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={toggleTheme}
              className="text-sm px-3 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--border)] hover:border-indigo-500/50 transition"
              title="Toggle theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </nav>

      {/* history drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[var(--panel)] border-l border-[var(--border)] p-4 overflow-y-auto animate-fade-up"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">History</h3>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory(clearHistory())}
                    className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-white px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No saved diagrams yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((e) => (
                  <li
                    key={e.id}
                    className="group p-3 rounded-lg bg-[var(--panel-2)] border border-[var(--border)] hover:border-indigo-500/50 transition cursor-pointer"
                    onClick={() => openHistoryItem(e)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{e.title}</span>
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setHistory(deleteFromHistory(e.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="px-1.5 rounded bg-indigo-500/10 text-indigo-300">
                        {TYPE_LABEL[e.kind]}
                      </span>
                      <span>{new Date(e.at).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ===== hero ===== */}
        <section className="text-center mb-8 sm:mb-12 animate-fade-up">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Turn{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              plain text
            </span>
            <br className="hidden sm:block" /> into any diagram
          </h1>
          <p className="text-slate-400 mt-3 sm:mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            Flowcharts, 3D diagrams, sequence, ER, class, state, Gantt, mind
            maps, timelines & 9 chart types — all from a simple description.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-[var(--panel)] border border-[var(--border)] text-slate-300"
              >
                <span className="mr-1">{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </section>

        {/* ===== input ===== */}
        <section className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="bg-[var(--panel)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-xl shadow-black/20">
            <label className="text-sm font-medium mb-2 block">
              Describe your diagram
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate();
              }}
              placeholder="e.g. Sequence diagram of a payment flow between User, App, and Bank…"
              rows={3}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-y transition"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
              <p className="text-xs text-slate-500 order-2 sm:order-1">
                Tip: <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 border border-[var(--border)]">Ctrl</kbd>
                +<kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 border border-[var(--border)]">Enter</kbd> to generate
              </p>
              <button
                onClick={() => generate()}
                disabled={loading}
                className={`order-1 sm:order-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white disabled:opacity-50 font-medium transition shadow-lg shadow-indigo-900/30 ${
                  loading ? "" : "pulse-glow"
                }`}
              >
                {loading ? "Generating…" : "✨ Generate Diagram"}
              </button>
            </div>
          </div>
        </section>

        {/* ===== examples ===== */}
        <section className="mt-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-sm text-slate-400 mb-3">Try an example:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                onClick={() => {
                  setText(ex.prompt);
                  generate(ex.prompt);
                }}
                disabled={loading}
                className="group text-left p-3 rounded-xl bg-[var(--panel)] border border-[var(--border)] hover:border-indigo-500/50 hover:bg-[var(--panel-2)] transition disabled:opacity-50"
              >
                <div className="text-xl mb-1.5">{ex.icon}</div>
                <div className="text-xs font-medium group-hover:text-indigo-400 transition">
                  {ex.title}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ===== error ===== */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm animate-fade-up flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ===== loading skeleton ===== */}
        {loading && (
          <div className="mt-6 bg-[var(--panel)] rounded-2xl border border-[var(--border)] overflow-hidden animate-fade-up">
            <div className="h-14 border-b border-[var(--border)] px-4 flex items-center">
              <div className="skeleton h-4 w-40 rounded" />
            </div>
            <div className="p-6 space-y-4">
              <div className="skeleton h-64 w-full rounded-xl" />
            </div>
          </div>
        )}

        {/* ===== output ===== */}
        {diagram && !loading && (
          <section
            ref={outputRef}
            className="mt-6 bg-[var(--panel)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xl shadow-black/20 animate-fade-up"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-xs px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 capitalize">
                  {isMermaid ? diagram.diagramType : TYPE_LABEL[diagram.kind]}
                </span>
                <h2 className="font-semibold truncate">{diagram.title}</h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isFlow && (
                  <div className="flex rounded-lg bg-[var(--bg)] border border-[var(--border)] p-0.5">
                    <TabBtn active={view === "2d"} onClick={() => setView("2d")}>2D</TabBtn>
                    <TabBtn active={view === "3d"} onClick={() => setView("3d")}>3D</TabBtn>
                  </div>
                )}
                <button onClick={startEdit} disabled={!canEdit} className="toolbtn">✏️ <span className="hidden sm:inline">Edit</span></button>
                <button onClick={handleCopy} className="toolbtn">📋 <span className="hidden sm:inline">Copy</span></button>
                <button onClick={handlePng} className="toolbtn">🖼️ PNG</button>
                <button onClick={handleSvg} disabled={!svgAvailable} className="toolbtn">📐 SVG</button>
              </div>
            </div>

            {/* editing panel */}
            {editing && (
              <div className="p-4 border-b border-[var(--border)] bg-[var(--panel-2)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {isChart ? "Edit chart JSON" : "Edit diagram code (Mermaid)"}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded bg-slate-500/20">Cancel</button>
                    <button onClick={applyEdit} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white">Apply</button>
                  </div>
                </div>
                <textarea
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  className="w-full font-mono text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 outline-none focus:border-indigo-500 resize-y"
                />
              </div>
            )}

            <div ref={stageRef} className="p-2 sm:p-4 bg-[var(--bg)] overflow-x-auto">
              {/* manual override (edited code) renders via mermaid */}
              {overrideCode && (isFlow || isMermaid) && (
                <MermaidView code={overrideCode} theme={theme} />
              )}
              {!overrideCode && isFlow && view === "2d" && (
                <Mermaid2D flow={diagram} theme={theme} />
              )}
              {!overrideCode && isFlow && view === "3d" && <Flow3D flow={diagram} />}
              {!overrideCode && isMermaid && (
                <MermaidView code={diagram.code} theme={theme} />
              )}
              {isChart && <ChartRenderer chart={diagram} theme={theme} />}
            </div>
          </section>
        )}

        {/* empty state */}
        {!diagram && !loading && !error && (
          <div className="mt-10 sm:mt-14 text-center animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="text-5xl mb-3 opacity-40">🎨</div>
            <p className="text-slate-500 text-sm">
              Your generated diagram will appear here.
            </p>
          </div>
        )}
      </div>

      <footer className="border-t border-[var(--border)] mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-600">
          Flowcharts · 3D · Sequence · ER · Class · State · Gantt · Mind Map ·
          Timeline · 9 chart types — describe it, we&apos;ll draw it.
        </div>
      </footer>

      <style jsx>{`
        .toolbtn {
          font-size: 0.8rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          background: var(--bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.15s;
        }
        .toolbtn:hover:not(:disabled) {
          border-color: rgba(99, 102, 241, 0.5);
        }
        .toolbtn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1 text-sm rounded-md transition font-medium ${
        active ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
