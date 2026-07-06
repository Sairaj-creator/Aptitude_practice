"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const topicData = [
  { topic: "Percent", accuracy: 84, time: 42 },
  { topic: "Ratio", accuracy: 78, time: 55 },
  { topic: "Series", accuracy: 91, time: 35 },
  { topic: "Verbal", accuracy: 72, time: 48 },
  { topic: "DI", accuracy: 66, time: 68 }
];

const trendData = [
  { day: "Mon", score: 61 },
  { day: "Tue", score: 68 },
  { day: "Wed", score: 73 },
  { day: "Thu", score: 71 },
  { day: "Fri", score: 79 },
  { day: "Sat", score: 84 },
  { day: "Sun", score: 88 }
];

export function PracticeOverviewChart() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="h-72 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-sm font-semibold">Topic Accuracy</div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={topicData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="topic" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="accuracy" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-sm font-semibold">Weekly Mock Trend</div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend />
            <Line dataKey="score" stroke="#b45309" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
