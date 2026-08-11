import Link from "next/link";
import { Wind, Thermometer, Droplets, Bug, CloudLightning, MapPin, Brain, Siren, Leaf } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClimateBackground } from "@/components/motion/climate-background";
import { Reveal } from "@/components/motion/reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";

const RISK_CATEGORIES = [
  { icon: Wind, label: "Air", detail: "AQI, PM2.5/PM10, O3, NO2 — explainable air-risk scoring." },
  { icon: Thermometer, label: "Heat", detail: "Heat-index modelling, peak-hour warnings, safer activity windows." },
  { icon: Droplets, label: "Water", detail: "Rainfall trends, citizen reports, water-point availability." },
  { icon: Bug, label: "Disease", detail: "Dengue/malaria environmental suitability — not a diagnosis." },
  { icon: CloudLightning, label: "Disaster", detail: "Flood, cyclone, wildfire and lightning risk indicators." },
];

const HOW_IT_WORKS = [
  {
    icon: MapPin,
    title: "1. Set your location",
    body: "Use browser geolocation, search a city, or save multiple locations to track.",
  },
  {
    icon: Brain,
    title: "2. We compute explainable risk",
    body: "Real weather and air-quality data feed a transparent, weighted risk engine — every score shows its contributing factors.",
  },
  {
    icon: Siren,
    title: "3. You get guidance, not guesswork",
    body: "Personalized precautions, safer time windows, and nearby emergency resources — clearly labelled as guidance, not diagnosis.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-sm font-semibold tracking-tight">
          ClimateGuardian <span className="text-brand">AI</span>
        </span>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            Get started
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
        <ClimateBackground />

        <Reveal speed="slow">
          <p className="text-xs font-medium uppercase tracking-widest text-brand">Climate &amp; Wellbeing Intelligence</p>
        </Reveal>

        <Reveal speed="slow" delay={0.08}>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Predict Climate Risk.
            <br />
            Protect Human Health.
          </h1>
        </Reveal>

        <Reveal speed="slow" delay={0.16}>
          <p className="mt-5 max-w-xl text-base text-foreground-muted">
            ClimateGuardian AI turns live weather and air-quality data into explainable air, heat, water,
            disease-environmental and disaster risk scores — with personalized guidance and real emergency
            resources.
          </p>
        </Reveal>

        <Reveal speed="slow" delay={0.24}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Check Your Climate Risk
            </Link>
            <Link href="#intelligence" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Explore Intelligence
            </Link>
          </div>
        </Reveal>

        <Reveal speed="slow" delay={0.3}>
          <p className="mt-6 max-w-md text-xs text-foreground-muted">
            Environmental &amp; public-health guidance only — not a diagnostic or emergency alerting system.
          </p>
        </Reveal>
      </section>

      {/* INTRO */}
      <section id="intelligence" className="border-t border-border px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Environmental data, made explainable
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 text-sm text-foreground-muted">
              Instead of a single opaque &ldquo;risk level,&rdquo; ClimateGuardian shows the actual contributing
              factors behind every score — so you can understand not just what your risk is, but why.
            </p>
          </Reveal>
        </div>
      </section>

      {/* RISK CATEGORIES */}
      <section className="border-t border-border bg-surface-muted/40 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Five risk categories, one clear score
            </h2>
          </Reveal>
          <StaggerContainer className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {RISK_CATEGORIES.map(({ icon: Icon, label, detail }) => (
              <StaggerItem key={label}>
                <Card className="h-full">
                  <CardHeader>
                    <Icon className="size-5 text-brand" />
                    <CardTitle className="mt-2 text-base">{label}</CardTitle>
                    <CardDescription>{detail}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              How ClimateGuardian works
            </h2>
          </Reveal>
          <StaggerContainer className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title}>
                <div className="flex flex-col gap-2">
                  <Icon className="size-5 text-brand" />
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-foreground-muted">{body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* AI PERSONALIZATION */}
      <section className="border-t border-border bg-surface-muted/40 px-6 py-24 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:items-center">
          <Reveal direction="right">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-brand">AI Climate Brief</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Guidance built from your profile, not generic tips
              </h2>
              <p className="mt-4 text-sm text-foreground-muted">
                ClimateGuardian combines your location&apos;s live risk data with your health profile —
                age group, vulnerability category, outdoor-worker status — to generate personalized,
                explainable guidance. If the AI provider is unavailable, a deterministic rule-based
                explanation takes over automatically, so you&apos;re never left without an answer.
              </p>
            </div>
          </Reveal>
          <Reveal direction="left" delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Climate Brief</CardTitle>
                <CardDescription>Example — generated per user, not shown here as live data</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-foreground-muted">
                <p>&ldquo;Air pollution is currently the biggest contributor to your climate-health risk.&rdquo;</p>
                <p className="mt-3 font-medium text-foreground">What to do now</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>Avoid intense outdoor exercise</li>
                  <li>Wear a suitable protective mask outdoors</li>
                  <li>Prefer indoor activity during peak pollution</li>
                </ul>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* EMERGENCY */}
      <section className="border-t border-border px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Siren className="mx-auto size-6 text-brand" />
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Real emergency resources, clearly labelled
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-sm text-foreground-muted">
              Hospitals, shelters and water points near you, sorted by distance — with a clear
              distinction between official alerts, modelled risk, and citizen reports. ClimateGuardian
              never presents a model estimate as an official government warning.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CARBON */}
      <section className="border-t border-border bg-surface-muted/40 px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Leaf className="mx-auto size-6 text-brand" />
          <Reveal delay={0.05}>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Track what you can control
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-sm text-foreground-muted">
              A carbon wallet for transport, electricity, flights, food and shopping — with a green
              score and concrete reduction suggestions, not just a number.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-24 text-center sm:px-10">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Know your risk before it becomes an emergency
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Create your account
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Sign in
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-foreground-muted sm:px-10">
        <Link href="/privacy" className="underline">
          Privacy policy
        </Link>
      </footer>
    </div>
  );
}
