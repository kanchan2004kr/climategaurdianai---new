"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { duration as durationTokens } from "@/lib/motion/tokens";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  className?: string;
  /** "medium" for in-place UI, "slow" for hero/section-level reveals. */
  speed?: "fast" | "medium" | "slow";
  once?: boolean;
}

const OFFSET = 16;

function offsetFor(direction: RevealDirection): { x?: string; y?: string } {
  switch (direction) {
    case "up":
      return { y: `${OFFSET}px` };
    case "down":
      return { y: `-${OFFSET}px` };
    case "left":
      return { x: `${OFFSET}px` };
    case "right":
      return { x: `-${OFFSET}px` };
    default:
      return {};
  }
}

/**
 * Fades (and optionally slides) content in via a CSS class toggle once it
 * enters the viewport. Implemented without any animation library: the
 * hidden/visible class swap happens after mount (post-hydration), so the
 * server-rendered markup and the first client paint are always identical —
 * this class of component can never trigger a hydration mismatch.
 */
export function Reveal({ children, direction = "up", delay = 0, className, speed = "medium", once = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { rootMargin: "-10% 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const offset = offsetFor(direction);
  const style: CSSProperties & Record<string, string> = {
    "--reveal-duration": `${durationTokens[speed === "fast" ? "fast" : speed]}s`,
    "--reveal-delay": `${delay}s`,
  };
  if (offset.x) style["--reveal-x"] = offset.x;
  if (offset.y) style["--reveal-y"] = offset.y;

  return (
    <div ref={ref} className={cn("reveal", visible && "reveal-visible", className)} style={style}>
      {children}
    </div>
  );
}
