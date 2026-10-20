import Link from "next/link";
import { Fragment } from "react";

/**
 * Renders the assistant's small markdown subset safely: paragraphs, "- "
 * bullets, **bold** and [links](/path). Only site paths and https links are
 * turned into anchors; anything else stays plain text.
 */
function inline(text: string, keyPrefix: string) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null = re.exec(text);
  let i = 0;
  while (m) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] && m[2]) {
      const href = m[2];
      if (href.startsWith("/")) {
        parts.push(
          <Link key={key} href={href} className="font-medium text-primary underline-offset-2 hover:underline">
            {m[1]}
          </Link>,
        );
      } else if (href.startsWith("https://")) {
        parts.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {m[1]}
          </a>,
        );
      } else {
        parts.push(m[1]);
      }
    } else if (m[3]) {
      parts.push(
        <strong key={key} className="font-semibold">
          {m[3]}
        </strong>,
      );
    }
    last = m.index + m[0].length;
    m = re.exec(text);
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, b) => {
        const lines = block.split("\n");
        const bullets = lines.every((l) => /^\s*[-•*]\s+/.test(l));
        if (bullets) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no identity beyond position
            <ul key={b} className="list-disc space-y-1 pl-4">
              {lines.map((l, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond position
                <li key={i}>{inline(l.replace(/^\s*[-•*]\s+/, ""), `${b}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no identity beyond position
          <p key={b}>
            {lines.map((l, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity beyond position
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(l, `${b}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
