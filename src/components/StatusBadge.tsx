import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { StatusConciliacao } from "@/types/domain";
import clsx from "clsx";

const CONFIG: Record<
  StatusConciliacao,
  { label: string; icon: typeof CheckCircle2; classes: string }
> = {
  conciliado: {
    label: "Conciliado",
    icon: CheckCircle2,
    classes: "bg-pix-500/10 text-pix-400 border-pix-500/30",
  },
  pendente: {
    label: "Pendente",
    icon: Clock,
    classes: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  divergente: {
    label: "Divergente",
    icon: AlertTriangle,
    classes: "bg-coral-500/10 text-coral-500 border-coral-500/30",
  },
};

export function StatusBadge({ status }: { status: StatusConciliacao }) {
  const { label, icon: Icon, classes } = CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        classes
      )}
    >
      <Icon size={13} strokeWidth={2.25} />
      {label}
    </span>
  );
}
