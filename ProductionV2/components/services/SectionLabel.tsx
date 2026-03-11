import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-xs uppercase tracking-widest text-[var(--brand-orange)] mb-4",
        className
      )}
    >
      [{children}]
    </p>
  );
}
