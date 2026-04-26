"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPrice } from "@/lib/utils";

interface ChartData {
  date: string;
  revenue: number;
}

interface PieData {
  name: string;
  value: number;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) return <p className="text-muted-foreground text-sm">No revenue data yet</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(v) => `KES ${v}`} />
          <Tooltip formatter={(v) => [v != null ? formatPrice(Number(v)) : "", "Revenue"]} />
          <Line type="monotone" dataKey="revenue" stroke="#CC3D00" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({ data }: { data: PieData[] }) {
  if (data.length === 0) return <p className="text-muted-foreground text-sm">No orders yet</p>;
  const colors = ["#CC3D00", "#00C896", "#6B6B6B", "#FF9500"];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
