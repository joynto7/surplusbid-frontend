import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DEPOSIT_PERCENT, PAYMENT_DEADLINE_HOURS } from "@/lib/config";

export const metadata: Metadata = {
  title: "FAQ: deposits, bidding & payments",
  description: "Answers about SurplusBid deposit holds, anti-sniping, verification, payment deadlines and disputes.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "SurplusBid FAQ", url: "/faq" },
};

const SECTIONS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "Deposits & payments",
    items: [
      {
        q: "How much is the deposit hold?",
        a: `${DEPOSIT_PERCENT}% of the lot's starting price. It's authorized on your card per lot before your first bid, not charged.`,
      },
      {
        q: "When is my deposit released?",
        a: "As soon as a lot closes and you're not the winner, the hold is released automatically. You don't need to request it.",
      },
      {
        q: "I won. What do I pay?",
        a: `Your deposit is captured and applied, and you pay the remaining balance by card through Stripe within ${PAYMENT_DEADLINE_HOURS} hours of the close.`,
      },
      {
        q: "What if I miss the payment deadline?",
        a: "The deposit is forfeited and the lot rolls to the next-highest bidder.",
      },
      {
        q: "Is my card data stored by SurplusBid?",
        a: "No. Card details are entered in Stripe's secure Payment Element and never touch SurplusBid servers.",
      },
    ],
  },
  {
    title: "Bidding",
    items: [
      {
        q: "What's the minimum bid?",
        a: "The current highest bid (or the starting price if there are none) plus the lot's bid increment.",
      },
      {
        q: "How does anti-sniping work?",
        a: "Any bid placed in the final two minutes pushes the close back by two minutes, so there's always time to respond.",
      },
      {
        q: "Can I see who else is bidding?",
        a: "No. The bid history shows amounts and times, not bidder identities.",
      },
      {
        q: "What is a reserve price?",
        a: "The seller's private minimum. Only the seller sees the amount and whether bidding has reached it.",
      },
    ],
  },
  {
    title: "Accounts & verification",
    items: [
      {
        q: "Why do I need to verify my business?",
        a: "SurplusBid is B2B only. An admin reviews your registration document before you can bid or sell.",
      },
      {
        q: "How long does verification take?",
        a: (
          <>
            Usually one business day. You can check progress on the{" "}
            <Link href="/verification-status" className="text-primary underline">
              verification status
            </Link>{" "}
            page.
          </>
        ),
      },
      {
        q: "Can I sign in with Google?",
        a: "Yes, as long as your Google account uses your work email.",
      },
    ],
  },
  {
    title: "Disputes",
    items: [
      {
        q: "Something's wrong with a lot I won. What now?",
        a: "Open a dispute from your dashboard. Only the winning bidder and the seller can raise one, and an admin reviews it and records a resolution.",
      },
    ],
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((s) =>
      s.items
        .filter((i) => typeof i.a === "string")
        .map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
    ),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from constants above
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="space-y-3">
        <h1 className="font-semibold text-4xl tracking-tight">Frequently asked questions</h1>
        <p className="text-lg text-muted-foreground">
          Deposits, bidding rules and payments, explained. Still stuck?{" "}
          <Link href="/contact" className="text-primary underline">
            Contact us
          </Link>
          .
        </p>
      </header>
      {SECTIONS.map((s) => (
        <section key={s.title} aria-labelledby={s.title} className="space-y-3">
          <h2 id={s.title} className="font-semibold text-xl">
            {s.title}
          </h2>
          <Accordion type="single" collapsible className="rounded-lg border px-4">
            {s.items.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}
