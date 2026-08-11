import Link from "next/link";
import { Wind, Thermometer, Droplets, Bug, CloudLightning, ChevronRight } from "lucide-react";
import { Badge, riskVariant } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";
import { scoreToLevel } from "@/lib/types/risk";

interface CategoryEntry {
  key: "air" | "heat" | "water" | "disease" | "disaster";
  href: string;
  label: string;
  icon: typeof Wind;
  score: number;
}

export function RiskCategoryGrid({
  air,
  heat,
  water,
  disease,
  disaster,
}: {
  air: number;
  heat: number;
  water: number;
  disease: number;
  disaster: number;
}) {
  const entries: CategoryEntry[] = [
    { key: "air", href: "/risks/air", label: "Air", icon: Wind, score: air },
    { key: "heat", href: "/risks/heat", label: "Heat", icon: Thermometer, score: heat },
    { key: "water", href: "/risks/water", label: "Water", icon: Droplets, score: water },
    { key: "disease", href: "/risks/disease", label: "Disease", icon: Bug, score: disease },
    { key: "disaster", href: "/risks/disaster", label: "Disaster", icon: CloudLightning, score: disaster },
  ];

  return (
    <StaggerContainer className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" gap="tight">
      {entries.map((entry) => {
        const level = scoreToLevel(entry.score);
        const Icon = entry.icon;
        return (
          <StaggerItem key={entry.key}>
            <Link
              href={entry.href}
              className="group block h-full rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-foreground-muted transition-colors duration-150 group-hover:translate-x-0.5 group-hover:text-brand" />
                <ChevronRight className="size-4 text-foreground-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground-muted">{entry.label}</p>
              <p className="tabular mt-1 text-2xl font-semibold text-foreground">{Math.round(entry.score)}</p>
              <Badge variant={riskVariant(level)} className="mt-2">
                {level}
              </Badge>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
