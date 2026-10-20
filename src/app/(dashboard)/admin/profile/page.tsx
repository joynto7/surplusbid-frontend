import type { Metadata } from "next";
import { AccountCard, AppearanceCard } from "@/components/dashboard/profile/account-card";
import { ProfileForm } from "@/components/dashboard/profile/profile-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Profile & settings" };

export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile & settings" description="Your operator profile, account and preferences." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ProfileForm />
        <div className="space-y-6">
          <AccountCard />
          <AppearanceCard />
        </div>
      </div>
    </div>
  );
}
