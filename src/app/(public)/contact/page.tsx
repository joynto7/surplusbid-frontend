import { Clock, LifeBuoy, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about bidding, selling, verification or payments? Get in touch with the SurplusBid team.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact SurplusBid", url: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="font-semibold text-4xl tracking-tight">Talk to us</h1>
          <p className="text-lg text-muted-foreground">
            Questions about a lot, your verification, or a payment? We read every message.
          </p>
        </header>
        <ul className="space-y-4 text-sm">
          <li className="flex gap-3">
            <Mail className="mt-0.5 size-4 text-primary" aria-hidden />
            <span>
              <span className="font-medium">Email</span>
              <br />
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-muted-foreground hover:text-foreground">
                {SUPPORT_EMAIL}
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <Clock className="mt-0.5 size-4 text-primary" aria-hidden />
            <span>
              <span className="font-medium">Response time</span>
              <br />
              <span className="text-muted-foreground">Within one business day</span>
            </span>
          </li>
          <li className="flex gap-3">
            <LifeBuoy className="mt-0.5 size-4 text-primary" aria-hidden />
            <span>
              <span className="font-medium">Quick answers</span>
              <br />
              <Link href="/faq" className="text-muted-foreground underline hover:text-foreground">
                Read the FAQ
              </Link>
            </span>
          </li>
        </ul>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
          <CardDescription>All fields are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
