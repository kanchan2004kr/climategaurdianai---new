import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <div className="mt-6 space-y-5 text-sm leading-6 text-foreground-muted">
        <p>
          ClimateGuardian AI provides environmental and public-health <strong>guidance</strong> based on
          weather, air-quality and modelled risk data. It is not a medical device, does not diagnose or
          treat any condition, and does not replace official government emergency alerts.
        </p>
        <p>
          <strong className="text-foreground">What we collect.</strong> Account details (name, email),
          an optional profile (age group, vulnerability category, outdoor-worker status, notification
          preferences), and locations you choose to track. We deliberately do not collect detailed
          medical history or diagnoses.
        </p>
        <p>
          <strong className="text-foreground">How we use it.</strong> To compute personalized risk
          scores, send the alerts you opt into, and improve the accuracy of our risk models. We do not
          sell personal data.
        </p>
        <p>
          <strong className="text-foreground">AI assistant (ClimateGPT).</strong> Responses are
          generated from structured environmental data and general guidance. The assistant will not
          diagnose disease, prescribe medication, or claim certainty, and health-related answers include
          a disclaimer.
        </p>
        <p>
          <strong className="text-foreground">Demo mode.</strong> When this deployment is not connected
          to a live database, authentication runs against clearly-labeled demo accounts only — no real
          account data is created or stored.
        </p>
        <p>
          <strong className="text-foreground">Your controls.</strong> You can update or delete your
          profile and locations at any time from your account settings.
        </p>
      </div>
    </div>
  );
}
