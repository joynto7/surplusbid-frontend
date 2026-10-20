import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/shared/legal-page";
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The rules for buying and selling on SurplusBid: eligibility, deposits, bidding, payment, pickup and disputes.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "SurplusBid terms of service", url: "/terms" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "eligibility",
    title: "Who can use SurplusBid",
    body: (
      <>
        <p>
          SurplusBid is for businesses only. To bid or sell you must register with a work email, upload a business
          registration document, and be approved by a SurplusBid admin. You confirm that you are authorised to act for
          the company you register.
        </p>
        <p>
          You are responsible for keeping your password safe and for everything done from your account. Tell us straight
          away if you suspect someone else has access.
        </p>
      </>
    ),
  },
  {
    id: "listings",
    title: "Listing a lot",
    body: (
      <ul>
        <li>You must own the items, or be authorised to sell them, and they must be legal to sell and ship.</li>
        <li>
          Descriptions, photos, condition and quantity must be accurate. Known defects must be disclosed. AI-drafted
          descriptions are suggestions: you are responsible for checking them before publishing.
        </li>
        <li>
          Your reserve price is private. If bidding doesn&apos;t reach it, you aren&apos;t obliged to sell, and the lot
          closes as unsold.
        </li>
        <li>Once a lot is live and has bids, it can&apos;t be withdrawn except for a reason we approve.</li>
      </ul>
    ),
  },
  {
    id: "bidding",
    title: "Deposits and bidding",
    body: (
      <ul>
        <li>
          Before your first bid on a lot, we place a card hold of {DEPOSIT_PERCENT}% of the starting price. It is
          released automatically if you don&apos;t win.
        </li>
        <li>Every bid is a binding offer to buy the lot at that price if you win.</li>
        <li>A bid must be at least the current price plus the lot&apos;s bid increment.</li>
        <li>
          A bid placed in the final two minutes extends the close by two minutes, so everyone has a fair chance to
          respond.
        </li>
        <li>Shill bidding, collusion and bidding on your own lots are prohibited and lead to account closure.</li>
      </ul>
    ),
  },
  {
    id: "payment",
    title: "Winning and paying",
    body: (
      <>
        <p>
          The highest bid at the close wins, provided it meets the reserve. Your deposit is captured and applied, and
          the remaining balance must be paid by card within {PAYMENT_DEADLINE_HOURS} hours of the close.
        </p>
        <p>
          If you miss the deadline, the deposit is forfeited and the lot may be offered to the next-highest bidder.
          Payments are processed by Stripe.
        </p>
      </>
    ),
  },
  {
    id: "pickup",
    title: "Pickup and shipping",
    body: (
      <p>
        Unless the listing says otherwise, lots are sold as-is, where-is. The buyer arranges and pays for removal from
        the pickup location shown on the listing, and the seller provides reasonable access during business hours. Our{" "}
        <Link href="/blog/shipping-heavy-equipment-after-you-win" className="text-primary hover:underline">
          shipping guide
        </Link>{" "}
        explains how to plan it.
      </p>
    ),
  },
  {
    id: "reviews",
    title: "Reviews",
    body: (
      <p>
        Only the winning buyer of a sold lot can review its seller, once per lot. Reviews must be honest and about the
        transaction. We remove reviews that contain personal attacks, private information or content unrelated to the
        sale.
      </p>
    ),
  },
  {
    id: "disputes",
    title: "Disputes",
    body: (
      <p>
        If something goes wrong, the buyer or seller of a sold lot can open a dispute from their dashboard. An admin
        reviews the evidence from both sides and records a decision, which both parties can see. See the{" "}
        <Link href="/faq#disputes" className="text-primary hover:underline">
          dispute FAQ
        </Link>{" "}
        for details.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Our role and liability",
    body: (
      <p>
        SurplusBid provides the marketplace; the contract of sale is between the buyer and the seller. We verify that
        businesses exist, but we don&apos;t inspect items. To the extent the law allows, our liability for any claim is
        limited to the fees we received for the transaction in question.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and closure",
    body: (
      <p>
        We may suspend or close accounts that break these terms, fail verification, or put other users at risk. You can
        close your account at any time, after settling any outstanding payments or disputes.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We will give account holders at least 14 days&apos; notice by email before material changes take effect. Lots
        that are already live continue under the terms in force when they were published.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="2026-10-20"
      intro={
        <p>
          These terms govern every auction on SurplusBid. Please read them before you register: by creating an account
          you agree to them on behalf of your company.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
