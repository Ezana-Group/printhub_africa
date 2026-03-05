import { cn } from "@/lib/utils";

export function StrengthBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="font-mono text-xs text-white/60 min-w-[100px]">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i <= value ? "bg-[var(--brand-orange)]" : "bg-white/20"
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
