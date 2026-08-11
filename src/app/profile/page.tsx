import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAvailableLocations, resolveLocation } from "@/lib/services/dashboard/locations";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [locations, resolved, profile] = await Promise.all([
    getAvailableLocations(userId),
    resolveLocation(userId),
    prisma.profile.findUnique({ where: { userId } }).catch(() => null),
  ]);

  const preferences = {
    notifyEmail: profile?.notifyEmail ?? true,
    notifyAqi: profile?.notifyAqi ?? true,
    notifyHeat: profile?.notifyHeat ?? true,
    notifyRain: profile?.notifyRain ?? true,
    notifyFlood: profile?.notifyFlood ?? true,
    notifyWater: profile?.notifyWater ?? true,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-foreground-muted">Manage your account, default location and alert preferences.</p>
        </div>
        <SignOutButton />
      </div>

      {locations.length === 0 ? (
        <Alert variant="error">No locations available yet. Add one from your Health profile to get started.</Alert>
      ) : (
        <ProfileSettings
          name={session.user.name ?? null}
          email={session.user.email ?? null}
          role={session.user.role ?? "USER"}
          locations={locations}
          selectedLocationId={resolved?.id ?? locations[0].id}
          preferences={preferences}
          canEditProfile={!session.user.isDemoAccount}
        />
      )}
    </div>
  );
}
