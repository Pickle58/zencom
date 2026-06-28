import { cn } from "@/lib/utils";

type UsageMeterProps = {
  label: string;
  used: number;
  limit: number | null;
  className?: string;
};

function formatLimit(limit: number | null): string {
  if (limit === null) return "unlimited";
  return limit.toLocaleString();
}

function progressPercent(used: number, limit: number | null): number {
  if (limit === null || limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

export function UsageMeter({ label, used, limit, className }: UsageMeterProps) {
  const isUnlimited = limit === null;
  const percent = isUnlimited ? 0 : progressPercent(used, limit);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {used.toLocaleString()} / {formatLimit(limit)}
        </span>
      </div>
      {isUnlimited ? (
        <p className="text-muted-foreground text-xs">Unlimited on this plan</p>
      ) : (
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
