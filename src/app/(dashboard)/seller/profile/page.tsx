import type { Metadata } from "next";
import { AccountCard, AppearanceCard } from "@/components/dashboard/profile/account-card";
import { ProfileForm } from "@/components/dashboard/profile/profile-form";
import { SellerDefaultsForm } from "@/components/dashboard/profile/seller-defaults-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Profile & availability" };

export default function SellerProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile & availability" description="Your company details and default auction schedule." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <ProfileForm />
          <SellerDefaultsForm />
        </div>
        <div className="space-y-6">
          <AccountCard />
          <AppearanceCard />
        </div>
      </div>
    </div>
  );
}
