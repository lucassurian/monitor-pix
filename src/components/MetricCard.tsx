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
  default: "text-ink-950 dark:text-paper-50",
  pix: "text-pix-500 dark:text-pix-400",
  amber: "text-amber-500",
  coral: "text-coral-500",
};

export function MetricCard({ label, value, icon: Icon, tone = "default", hint }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/60">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-500 font-medium dark:text-paper-100/50">
          {label}
        </span>
        <Icon size={16} className={clsx(TONE_CLASSES[tone], "opacity-80")} />
      </div>
      <div className={clsx("mt-3 font-display text-3xl font-semibold", TONE_CLASSES[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-gray-400 dark:text-paper-100/40">{hint}</div>}
    </div>
  );
}
