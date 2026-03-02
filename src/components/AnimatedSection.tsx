import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const delayClasses: Array<{ ms: number; className: string }> = [
  { ms: 0, className: "" },
  { ms: 75, className: "delay-75" },
  { ms: 100, className: "delay-100" },
  { ms: 150, className: "delay-150" },
  { ms: 200, className: "delay-200" },
  { ms: 300, className: "delay-300" },
  { ms: 500, className: "delay-500" },
  { ms: 700, className: "delay-700" },
  { ms: 1000, className: "delay-1000" },
];

function nearestDelayClass(delayMs: number) {
  let best = delayClasses[0];
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const candidate of delayClasses) {
    const diff = Math.abs(delayMs - candidate.ms);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }

  return best.className;
}

const AnimatedSection = ({ children, className, delay = 0 }: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        nearestDelayClass(delay),
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
