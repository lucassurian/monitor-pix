import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "pix" | "amber" | "coral";
  hint?: string;
}

const TONE_CLASSES: Record<string, string> = {
  default: "text-paper-50",
  pix: "text-pix-400",
  amber: "text-amber-500",
  coral: "text-coral-500",
};

export function MetricCard({ label, value, icon: Icon, tone = "default", hint }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-paper-100/50 font-medium">
          {label}
        </span>
        <Icon size={16} className={clsx(TONE_CLASSES[tone], "opacity-80")} />
      </div>
      <div className={clsx("mt-3 font-display text-3xl font-semibold", TONE_CLASSES[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-paper-100/40">{hint}</div>}
    </div>
  );
}
