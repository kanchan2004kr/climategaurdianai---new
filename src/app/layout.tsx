import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ClimateGuardian AI — Predict Climate Risk. Protect Human Health.",
    template: "%s · ClimateGuardian AI",
  },
  description:
    "ClimateGuardian AI combines environmental intelligence, climate risk scoring, public-health guidance and emergency resources in one platform.",
  openGraph: {
    title: "ClimateGuardian AI",
    description: "Predict Climate Risk. Protect Human Health.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClimateGuardian AI",
    description: "Predict Climate Risk. Protect Human Health.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <MotionProvider>{children}</MotionProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
