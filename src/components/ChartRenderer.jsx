"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Validated categorical palette — fixed order, never cycled.
const PALETTE = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#06b6d4", // cyan
  "#a855f7", // purple
  "#84cc16", // lime
  "#ec4899", // pink
];

export default function ChartRenderer({ chart, theme = "dark" }) {
  if (!chart) return null;
  const { chartType, data, categoryKey, valueKeys } = chart;

  const AXIS = theme === "light" ? "#475569" : "#94a3b8";
  const GRID = theme === "light" ? "#e2e8f0" : "#233047";
  const tooltipStyle = {
    background: theme === "light" ? "#ffffff" : "#0f1524",
    border: `1px solid ${GRID}`,
    borderRadius: 8,
    color: theme === "light" ? "#0f172a" : "#e5e7eb",
  };
  const H = 420;

  // ---- PIE / DONUT ----
  if (chartType === "pie" || chartType === "donut") {
    const key = valueKeys[0];
    return (
      <ResponsiveContainer width="100%" height={H}>
        <PieChart>
          <Pie
            data={data}
            dataKey={key}
            nameKey={categoryKey}
            cx="50%"
            cy="50%"
            innerRadius={chartType === "donut" ? 80 : 0}
            outerRadius={150}
            label={(d) => d[categoryKey]}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={PALETTE[i % PALETTE.length]}
                stroke={theme === "light" ? "#ffffff" : "#070b14"}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // ---- SCATTER ----
  if (chartType === "scatter") {
    const yKey = valueKeys[0];
    return (
      <ResponsiveContainer width="100%" height={H}>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey={categoryKey}
            name={categoryKey}
            stroke={AXIS}
            tick={{ fill: AXIS }}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name={yKey}
            stroke={AXIS}
            tick={{ fill: AXIS }}
          />
          <ZAxis range={[80, 80]} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={data} fill={PALETTE[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // ---- RADAR ----
  if (chartType === "radar") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={140}>
          <PolarGrid stroke={GRID} />
          <PolarAngleAxis dataKey={categoryKey} tick={{ fill: AXIS }} />
          <PolarRadiusAxis tick={{ fill: AXIS }} />
          {valueKeys.map((k, i) => (
            <Radar
              key={k}
              name={k}
              dataKey={k}
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.3}
            />
          ))}
          <Tooltip contentStyle={tooltipStyle} />
          {valueKeys.length > 1 && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  const axes = (
    <>
      <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff10" }} />
      {valueKeys.length > 1 && <Legend />}
    </>
  );

  // ---- LINE ----
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          {axes}
          <XAxis dataKey={categoryKey} stroke={AXIS} tick={{ fill: AXIS }} />
          <YAxis stroke={AXIS} tick={{ fill: AXIS }} />
          {valueKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // ---- AREA ----
  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <AreaChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
          {axes}
          <XAxis dataKey={categoryKey} stroke={AXIS} tick={{ fill: AXIS }} />
          <YAxis stroke={AXIS} tick={{ fill: AXIS }} />
          {valueKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={PALETTE[i % PALETTE.length]}
              fill={PALETTE[i % PALETTE.length]}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // ---- HORIZONTAL BAR ----
  if (chartType === "horizontal-bar") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
        >
          {axes}
          <XAxis type="number" stroke={AXIS} tick={{ fill: AXIS }} />
          <YAxis
            type="category"
            dataKey={categoryKey}
            stroke={AXIS}
            tick={{ fill: AXIS }}
            width={90}
          />
          {valueKeys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              fill={PALETTE[i % PALETTE.length]}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // ---- BAR / STACKED-BAR (default) ----
  const stacked = chartType === "stacked-bar";
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
        {axes}
        <XAxis dataKey={categoryKey} stroke={AXIS} tick={{ fill: AXIS }} />
        <YAxis stroke={AXIS} tick={{ fill: AXIS }} />
        {valueKeys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            stackId={stacked ? "a" : undefined}
            fill={PALETTE[i % PALETTE.length]}
            radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
