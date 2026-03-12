"use client";

import { cn } from "@/lib/utils";
import type { CheckoutStep } from "@/store/checkout-store";

const STEPS: { num: CheckoutStep; label: string }[] = [
  { num: 1, label: "Contact" },
  { num: 2, label: "Delivery" },
  { num: 3, label: "Payment" },
  { num: 4, label: "Review" },
];

export function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
}) {
  return (
    <nav aria-label="Checkout progress" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;
          const isUpcoming = currentStep < step.num;
          const canGoBack = isCompleted && onStepClick;
          return (
            <li
              key={step.num}
              className={cn(
                "flex flex-1 items-center last:flex-none",
                index < STEPS.length - 1 && "min-w-0"
              )}
            >
              <div
                role={canGoBack ? "button" : undefined}
                tabIndex={canGoBack ? 0 : undefined}
                onClick={canGoBack ? () => onStepClick(step.num) : undefined}
                onKeyDown={
                  canGoBack
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onStepClick(step.num);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "flex flex-col items-center gap-1.5",
                  canGoBack && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                )}
                aria-label={canGoBack ? `Go back to ${step.label}` : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isActive && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-[#F9FAFB]",
                    isUpcoming && "border-2 border-muted-foreground/30 bg-transparent text-muted-foreground",
                    canGoBack && "hover:opacity-90"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <span aria-hidden className="text-white">✓</span>
                  ) : (
                    step.num
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground",
                    canGoBack && "hover:text-foreground hover:underline"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 min-w-[8px] sm:mx-2",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
