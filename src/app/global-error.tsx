"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the
 * whole document, so it can't rely on providers, fonts or globals.css.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>SurplusBid hit an unexpected error</h1>
          <p style={{ color: "#64748b", marginBottom: 20 }}>
            {error.message || "Please try again."}
            {error.digest ? ` (ref ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#2563eb",
              color: "white",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload SurplusBid
          </button>
        </div>
      </body>
    </html>
  );
}
