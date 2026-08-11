"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Children, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";
import { duration, stagger } from "@/lib/motion/tokens";

const StaggerVisibleContext = createContext(false);

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  gap?: "tight" | "normal";
}

/** Wraps a list of StaggerItem children so they reveal in sequence once the group enters view. Pure CSS — see Reveal for why. */
export function StaggerContainer({ children, className, gap = "normal" }: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-10% 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Assign each StaggerItem child its position explicitly (deterministic,
  // server === client) rather than via a mutable shared counter.
  const indexed = Children.map(children, (child, index) =>
    isValidElement(child) ? cloneElement(child, { "data-stagger-index": index, "data-stagger-gap": gap } as never) : child
  );

  return (
    <div ref={ref} className={className}>
      <StaggerVisibleContext.Provider value={visible}>{indexed}</StaggerVisibleContext.Provider>
    </div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  "data-stagger-index"?: number;
  "data-stagger-gap"?: "tight" | "normal";
}

export function StaggerItem({
  children,
  className,
  "data-stagger-index": index = 0,
  "data-stagger-gap": gap = "normal",
}: StaggerItemProps) {
  const visible = useContext(StaggerVisibleContext);
  const delay = index * stagger[gap];

  const style = {
    "--reveal-duration": `${duration.medium}s`,
    "--reveal-y": "12px",
    "--reveal-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <div className={cn("reveal", visible && "reveal-visible", className)} style={style}>
      {children}
    </div>
  );
}
