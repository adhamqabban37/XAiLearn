/**
 * Firebase Connection Diagnostics Component
 * Verifies Firebase setup and displays real-time connection status
 * Use this component during development to diagnose connection issues
 */

"use client";

import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/lib/network.client";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  details?: string;
}

export function FirebaseDiagnostics() {
  const isOnline = useNetworkStatus();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Check environment variables
    const envVars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const missingEnvVars = Object.entries(envVars)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    diagnostics.push({
      name: "Environment Variables",
      status: missingEnvVars.length === 0 ? "success" : "error",
      message:
        missingEnvVars.length === 0
          ? "All Firebase env vars are configured"
          : `Missing: ${missingEnvVars.join(", ")}`,
      details:
        missingEnvVars.length === 0
          ? `Project: ${envVars.projectId}`
          : undefined,
    });

    // 2. Check for emulator settings
    const hasEmulator =
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST;
    diagnostics.push({
      name: "Emulator Detection",
      status: hasEmulator ? "warning" : "success",
      message: hasEmulator
        ? "⚠️ Emulator environment variables detected"
        : "No emulator variables (production mode)",
      details: hasEmulator
        ? `FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST}`
        : undefined,
    });

    // 3. Check network connectivity
    diagnostics.push({
      name: "Network Status",
      status: isOnline ? "success" : "error",
      message: isOnline ? "Browser is online" : "Browser is offline",
    });

    // 4. Test Firestore connection with a dummy read
    if (isOnline && auth.currentUser) {
      try {
        const testDocRef = doc(db, "users", auth.currentUser.uid);
        await getDoc(testDocRef);
        diagnostics.push({
          name: "Firestore Connection",
          status: "success",
          message: "Successfully connected to Firestore",
          details: "Read operation completed",
        });
      } catch (error: any) {
        diagnostics.push({
          name: "Firestore Connection",
          status: "error",
          message: `Firestore error: ${error?.code || "unknown"}`,
          details: error?.message || "No details available",
        });
      }
    } else if (!auth.currentUser) {
      diagnostics.push({
        name: "Firestore Connection",
        status: "warning",
        message: "Cannot test Firestore (not authenticated)",
        details: "Sign in to run Firestore connectivity tests",
      });
    }

    // 5. Check IndexedDB persistence
    if (typeof window !== "undefined" && "indexedDB" in window) {
      diagnostics.push({
        name: "IndexedDB Support",
        status: "success",
        message: "IndexedDB is supported",
        details: "Offline persistence is available",
      });
    } else {
      diagnostics.push({
        name: "IndexedDB Support",
        status: "warning",
        message: "IndexedDB not available",
        details: "Offline persistence will not work (private mode?)",
      });
    }

    setResults(diagnostics);
    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [isOnline]);

  const getIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Firebase Connection Status
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
          </CardTitle>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        <CardDescription>
          Real-time diagnostics for Firebase and network connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {testing && (
          <Alert>
            <AlertDescription>Running diagnostics...</AlertDescription>
          </Alert>
        )}

        {results.map((result, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start gap-2">
              {getIcon(result.status)}
              <div className="flex-1">
                <div className="font-medium">{result.name}</div>
                <div className="text-sm">{result.message}</div>
                {result.details && (
                  <div className="text-xs mt-1 opacity-75">
                    {result.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="text-xs text-muted-foreground mt-4">
          <strong>Tip:</strong> If you see offline errors, check:
          <ul className="list-disc list-inside ml-2 mt-1">
            <li>Your internet connection</li>
            <li>Firewall or antivirus blocking Firebase domains</li>
            <li>Multiple tabs (only one can have offline persistence)</li>
            <li>Private/incognito mode (IndexedDB may be disabled)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
