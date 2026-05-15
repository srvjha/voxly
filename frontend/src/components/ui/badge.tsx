import type { ComponentType, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Radio, Clock, Globe, FileText, Asterisk } from "lucide-react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent",
        secondary:
          "bg-secondary text-secondary-foreground border-transparent",
        outline: "bg-transparent text-foreground border-border",
        destructive:
          "bg-destructive text-destructive-foreground border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

type PollStatus = "draft" | "active" | "expired" | "published";

const STATUS_STYLES: Record<
  PollStatus,
  { className: string; label: string; icon: ComponentType<{ className?: string }> }
> = {
  draft: {
    className:
      "bg-elevated text-muted-foreground border-border ring-0",
    label: "Draft",
    icon: FileText,
  },
  active: {
    className:
      "bg-accent/12 text-accent-600 border-accent/30 dark:text-accent-300 dark:bg-accent/15",
    label: "Live",
    icon: Radio,
  },
  expired: {
    className:
      "bg-warning/15 text-amber-700 border-warning/30 dark:text-warning",
    label: "Expired",
    icon: Clock,
  },
  published: {
    className:
      "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
    label: "Published",
    icon: Globe,
  },
};

export function StatusBadge({
  status,
  className,
  withDot,
}: {
  status: PollStatus;
  className?: string;
  withDot?: boolean;
}) {
  const cfg = STATUS_STYLES[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
        cfg.className,
        className,
      )}
    >
      {withDot && status === "active" ? (
        <span className="live-dot" aria-hidden="true" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {cfg.label}
    </span>
  );
}

export function MandatoryBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        className,
      )}
    >
      <Asterisk className="h-2.5 w-2.5" /> Required
    </span>
  );
}
