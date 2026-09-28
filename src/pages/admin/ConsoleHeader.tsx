import type { ReactNode } from 'react';

/** The Standard file's "control room" header: eyebrow, title, and a flag strip. */
export default function ConsoleHeader({ eyebrow, title, flags }: { eyebrow: string; title: string; flags?: { text: ReactNode; hot?: boolean }[] }) {
  return (
    <header className="console-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {flags && flags.length > 0 && (
        <div className="console-flags">
          {flags.map((f, i) => (
            <span key={i} className={f.hot ? 'hot' : undefined}>
              {f.text}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
