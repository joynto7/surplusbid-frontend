import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Consistent spacing and heading for every home page section. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  muted = false,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-20", muted && "border-y bg-muted/30", className)}
    >
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            {eyebrow && <p className="font-semibold text-primary text-sm uppercase tracking-wider">{eyebrow}</p>}
            <h2 id={headingId} className="font-bold text-3xl tracking-tight sm:text-4xl">
              {title}
            </h2>
            {description && <p className="text-lg text-muted-foreground">{description}</p>}
          </div>
          {action && (
            <Button variant="ghost" asChild className="self-start sm:self-auto">
              <Link href={action.href}>
                {action.label} <LuArrowRight />
              </Link>
            </Button>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
