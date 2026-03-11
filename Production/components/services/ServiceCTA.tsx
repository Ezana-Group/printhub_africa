import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ServiceCTA({
  headline,
  subheadline,
  ctaPrimary,
  ctaPrimaryHref,
  ctaSecondary,
  ctaSecondaryHref,
  quote,
  quoteAuthor,
  stats,
  footerNote,
  variant = "orange",
  backgroundImage,
  className,
}: {
  headline: React.ReactNode;
  subheadline: string;
  ctaPrimary: string;
  ctaPrimaryHref: string;
  ctaSecondary?: string;
  ctaSecondaryHref?: string;
  quote?: string;
  quoteAuthor?: string;
  stats?: string;
  footerNote?: string;
  variant?: "orange" | "dark";
  backgroundImage?: string;
  className?: string;
}) {
  const isOrange = variant === "orange";
  return (
    <section
      className={cn(
        "relative py-24 px-6 md:px-12 lg:px-16 overflow-hidden",
        isOrange ? "bg-[var(--brand-orange)]" : "bg-[var(--brand-black)]",
        className
      )}
    >
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/85" aria-hidden />
        </>
      )}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
          {typeof headline === "string" ? (
            <span className={isOrange ? "text-[var(--brand-black)]" : "text-[var(--brand-white)]"}>
              {headline}
            </span>
          ) : (
            headline
          )}
        </h2>
        <p
          className={cn(
            "mt-6 text-lg md:text-xl max-w-2xl mx-auto",
            isOrange ? "text-black/80" : "text-white/70"
          )}
        >
          {subheadline}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            asChild
            className={cn(
              "rounded-xl px-8 py-6 text-base font-semibold h-auto min-h-[44px]",
              isOrange
                ? "bg-[var(--brand-black)] text-white hover:bg-black"
                : "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange)]/90"
            )}
          >
            <Link href={ctaPrimaryHref}>{ctaPrimary}</Link>
          </Button>
          {ctaSecondary && ctaSecondaryHref && (
            <Button
              asChild
              variant="ghost"
              className={cn(
                "rounded-xl px-8 py-6 text-base font-medium h-auto min-h-[44px] border",
                isOrange
                  ? "border-black/30 text-black hover:bg-black/10"
                  : "border-white/30 text-white hover:bg-white/10"
              )}
            >
              <Link href={ctaSecondaryHref}>{ctaSecondary}</Link>
            </Button>
          )}
        </div>
        {quote && (
          <blockquote className="mt-12 text-lg italic max-w-xl mx-auto">
            <span className={isOrange ? "text-black/70" : "text-white/70"}>
              &ldquo;{quote}&rdquo;
            </span>
            {quoteAuthor && (
              <footer className="mt-2 not-italic text-sm opacity-80">— {quoteAuthor}</footer>
            )}
          </blockquote>
        )}
        {stats && (
          <p className={cn("mt-8 font-mono text-sm", isOrange ? "text-black/60" : "text-white/60")}>
            {stats}
          </p>
        )}
        {footerNote && (
          <p className={cn("mt-8 font-mono text-xs", isOrange ? "text-black/50" : "text-white/50")}>
            {footerNote}
          </p>
        )}
      </div>
    </section>
  );
}
