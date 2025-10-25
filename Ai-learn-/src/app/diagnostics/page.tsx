"use client";

import dynamic from "next/dynamic";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Lazy-load diagnostics to avoid shipping it accidentally
const FirebaseDiagnostics = dynamic(
  () =>
    import("@/components/diagnostics/FirebaseDiagnostics").then(
      (m) => m.FirebaseDiagnostics
    ),
  { ssr: false }
);

export default function DiagnosticsPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert>
          <AlertDescription>
            Diagnostics are disabled in production.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FirebaseDiagnostics />
    </div>
  );
}
