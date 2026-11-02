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
  return (
    <Card className="p-5">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <div className="text-xs mt-1">
          {changePositive !== undefined
            ? changePositive
              ? "text-green-600"
              : "text-red-600"
            : "text-muted-foreground"}
          {change}
        </div>
      )}
      {icon && <div className="mt-3 text-muted-foreground">{icon}</div>}
    </Card>
  );
}
