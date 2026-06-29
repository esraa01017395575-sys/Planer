import React from "react";

interface HabitHeatmapProps {
  logs: Set<string>;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ logs }) => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0); // avoid daylight saving and timezone anomalies
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="grid gap-1 mt-4 animate-fadeIn" style={{ gridTemplateColumns: "repeat(30, 1fr)" }}>
      {days.map((d, idx) => (
        <div
          key={`${d}-${idx}`}
          title={d}
          className={`aspect-square rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 ${
            logs.has(d) ? "bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" : "bg-bg-secondary"
          }`}
        />
      ))}
    </div>
  );
};
