"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartPoint {
  name: string;
  count: number;
}

export function AdminDashboardCharts({
  workloadData,
  overdueByUserData,
  statusData,
}: {
  workloadData: ChartPoint[];
  overdueByUserData: ChartPoint[];
  statusData: ChartPoint[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Workload by team member</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" stroke="#e2e8f0" fontSize={12} tickLine={false} />
              <YAxis stroke="#e2e8f0" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
              />
              <Bar dataKey="count" fill="rgba(0, 150, 255, 0.85)" radius={[4, 4, 0, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Employees overdue on tasks</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overdueByUserData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" stroke="#e2e8f0" fontSize={12} tickLine={false} />
              <YAxis stroke="#e2e8f0" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
              />
              <Bar dataKey="count" fill="rgba(244, 63, 94, 0.85)" radius={[4, 4, 0, 0]} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold text-white mb-4">Task status distribution</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="name" stroke="#e2e8f0" fontSize={12} tickLine={false} />
              <YAxis stroke="#e2e8f0" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "rgba(15,15,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
              />
              <Bar dataKey="count" fill="rgba(16, 185, 129, 0.85)" radius={[4, 4, 0, 0]} name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
