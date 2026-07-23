"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { BalancePoint } from "@/lib/types";

const MILLION = 1_000_000;

function formatMillionTick(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1
  }).format(value / MILLION);
}

export function BalanceChart({ history }: { history: BalancePoint[] }) {
  if (history.length === 0) {
    return <p className="py-8 text-sm text-ink/60">Chưa có lịch sử chốt sổ.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
          <XAxis
            dataKey="snapshot_at"
            tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN")}
            tick={{ fontSize: 12, fill: "#596e54" }}
          />
          <YAxis
            tickFormatter={(value) => formatMillionTick(Number(value))}
            tick={{ fontSize: 12, fill: "#596e54" }}
            width={36}
          />
          <Tooltip
            formatter={(value) => [`${formatMoney(Number(value))} VND`, "Tổng"]}
            labelFormatter={(value) => formatDateTime(String(value))}
            contentStyle={{ borderRadius: 6, borderColor: "#d9ded6" }}
          />
          <Line type="monotone" dataKey="total" stroke="#426a8c" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
