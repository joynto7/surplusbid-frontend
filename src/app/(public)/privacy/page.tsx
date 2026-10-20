import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/shared/legal-page";
import { SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data SurplusBid collects, why, who processes it, and the choices you have.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "SurplusBid privacy policy", url: "/privacy" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "data-we-collect",
    title: "Data we collect",
    body: (
      <>
        <p>We collect only what we need to run a verified business-to-business marketplace:</p>
        <ul>
          <li>
            <strong>Account details:</strong> work email, company name, password hash (never the password itself), role,
            and optional profile fields such as contact name, phone, location and a short bio.
          </li>
          <li>
            <strong>Verification documents:</strong> the business registration document you upload so an admin can
            confirm your company exists.
          </li>
          <li>
            <strong>Marketplace activity:</strong> lots you list, bids, deposit holds, payments, reviews, disputes and
            the messages you send to support.
          </li>
          <li>
            <strong>Usage signals:</strong> which lots you view, so we can count views and recommend similar lots.
            Signed-out visitors get a random identifier stored in their browser instead of an account.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <ul>
        <li>To create your account, verify your business and keep the marketplace limited to real companies.</li>
        <li>
          To run auctions: placing bids, holding and releasing deposits, collecting payment and settling disputes.
        </li>
        <li>To personalise the catalogue, for example showing lots similar to ones you viewed.</li>
        <li>To detect abuse, such as bid manipulation, and to keep an audit trail of admin decisions.</li>
        <li>To answer your support requests and, if you subscribe, send the newsletter.</li>
      </ul>
    ),
  },
  {
    id: "processors",
    title: "Who processes your data",
    body: (
      <>
        <p>We use a small number of service providers, each limited to its job:</p>
        <ul>
          <li>
            <strong>Stripe</strong> processes card payments and deposit holds. Card numbers are entered in Stripe&apos;s
            Payment Element and never reach our servers.
          </li>
          <li>
            <strong>Cloudinary</strong> stores lot photos and verification documents.
          </li>
          <li>
            <strong>Google</strong> handles sign-in when you choose &quot;Continue with Google&quot;. We receive your
            name and email, not your Google password.
          </li>
          <li>
            <strong>Anthropic</strong> powers the AI assistant, search and listing helpers. Only the text you type and
            the relevant public lot details are sent.
          </li>
          <li>Hosting and database providers that run the application and store its data.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "What other users see",
    body: (
      <>
        <p>
          Bid history shows amounts and times, never bidder identities. Sellers&apos; company names, locations and
          ratings appear on their lots. When you win a lot, the seller sees your company name so pickup can be arranged.
          Reviews show the reviewer&apos;s company name.
        </p>
        <p>We never sell personal data.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        Account data is kept while your account is open. Transaction, payment and audit records are kept for seven years
        to meet accounting obligations. Support messages are deleted two years after they are closed. Verification
        documents are deleted 90 days after your account is closed.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        Passwords are hashed with bcrypt, sessions use short-lived signed tokens in HTTP-only cookies, all traffic uses
        HTTPS, and every admin action is written to an audit log. No system is perfectly secure; if we ever learn of a
        breach affecting your data we will tell you without undue delay.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your choices and rights",
    body: (
      <>
        <ul>
          <li>Edit your profile at any time from your dashboard.</li>
          <li>Unsubscribe from the newsletter using the link in any issue.</li>
          <li>Ask for a copy of your data, a correction, or deletion of your account.</li>
          <li>Clear the browser identifier and viewing history by clearing this site&apos;s storage.</li>
        </ul>
        <p>
          Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          for any request. We answer within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        We use essential cookies to keep you signed in, and local storage for preferences such as your theme, watchlist
        and recently viewed lots. We don&apos;t use advertising or cross-site tracking cookies.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy in a way that matters, we will email account holders and update the date above before
        the change takes effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="2026-10-20"
      intro={
        <p>
          SurplusBid is a marketplace for verified businesses. This policy explains what we collect, why we collect it,
          and how you stay in control.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
