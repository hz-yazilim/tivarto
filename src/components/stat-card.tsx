"use client";

import { Card, CardTitle } from "./ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  changePositive,
  icon,
}: StatCardProps) {
  const changeClass =
    changePositive === undefined
      ? "text-muted-foreground"
      : changePositive
        ? "text-emerald-400"
        : "text-rose-400";

  return (
    <Card className="p-5 transition-colors hover:border-purple-400/30">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      {change && <div className={`mt-1 text-xs ${changeClass}`}>{change}</div>}
      {icon && <div className="mt-3 text-muted-foreground">{icon}</div>}
    </Card>
  );
}
