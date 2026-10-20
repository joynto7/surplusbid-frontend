import Link from "next/link";
import { formatDate } from "@/lib/format";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Long-form policy layout: sticky table of contents beside numbered sections. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-3xl space-y-3 border-b pb-8">
        <p className="font-semibold text-primary text-sm uppercase tracking-wider">Legal</p>
        <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground">Last updated {formatDate(updated)}</p>
        <div className="text-lg text-muted-foreground">{intro}</div>
      </header>

      <div className="grid gap-10 pt-10 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 font-medium text-sm">On this page</p>
          <ol className="space-y-2 border-l text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="-ml-px block border-transparent border-l-2 pl-3 text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24 space-y-3">
              <h2 id={`${s.id}-title`} className="font-semibold text-2xl tracking-tight">
                {i + 1}. {s.title}
              </h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed [&_li]:pl-1 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
                {s.body}
              </div>
            </section>
          ))}
          <p className="rounded-xl border bg-muted/40 p-5 text-sm">
            Questions about this policy? Write to us through the{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              contact page
            </Link>{" "}
            and we&apos;ll reply within one business day.
          </p>
        </div>
      </div>
    </div>
  );
}
