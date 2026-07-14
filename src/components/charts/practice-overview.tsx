"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface ChartDataPoint {
  topic: string;
  accuracy: number;
  time?: number;
}

interface TrendDataPoint {
  day: string;
  score: number;
}

interface PracticeOverviewChartProps {
  topicData?: ChartDataPoint[];
  trendData?: TrendDataPoint[];
}

export function PracticeOverviewChart({ topicData = [], trendData = [] }: PracticeOverviewChartProps) {
  const hasTopicData = topicData.length > 0;
  const hasTrendData = trendData.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="h-72 rounded-lg border border-border bg-card p-4 flex flex-col">
        <div className="mb-3 text-sm font-semibold">Topic Accuracy</div>
        {hasTopicData ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={topicData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="topic" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
              <Bar dataKey="accuracy" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No topic accuracy data available. Solve questions to view.
          </div>
        )}
      </div>

      <div className="h-72 rounded-lg border border-border bg-card p-4 flex flex-col">
        <div className="mb-3 text-sm font-semibold">Weekly Mock Trend</div>
        {hasTrendData ? (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
              <Legend />
              <Line dataKey="score" stroke="#b45309" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No mock tests completed this week.
          </div>
        )}
      </div>
    </div>
  );
}
