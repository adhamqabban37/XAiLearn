"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="mx-auto max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Application error
            </h1>
            <p className="mt-3 text-muted-foreground">
              We hit an unexpected issue. You can try again or return home.
            </p>
            {error?.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Go home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
