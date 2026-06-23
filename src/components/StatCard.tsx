import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
  glow?: boolean;
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, className, glow }: StatCardProps) {
  return (
    <div className={cn("glass-card p-5 animate-fade-in", glow && "stat-glow", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={cn("text-xs font-medium", trend.positive ? "text-income" : "text-expense")}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
