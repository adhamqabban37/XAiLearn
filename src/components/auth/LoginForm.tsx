"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn, resendConfirmationEmail } from "@/lib/authSupabase";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }
    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          "Authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
        );
      }
      await signIn(trimmedEmail, trimmedPassword);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as any;
      const message: string = e?.message || "Failed to sign in";
      let friendly = "Failed to sign in";
      if (/invalid login credentials/i.test(message)) {
        friendly = "Invalid email or password.";
      } else if (/email not confirmed/i.test(message)) {
        friendly = "Please confirm your email before signing in.";
        setShowResend(true);
      } else if (/too many/i.test(message) || /rate/i.test(message)) {
        friendly = "Too many attempts. Please wait and try again.";
      } else if (/network/i.test(message) || /fetch/i.test(message)) {
        friendly = "Network error. Check your connection.";
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md circuit-bg border-accent/30 glow-subtle">
        <CardHeader className="text-center space-y-2 sm:space-y-3 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl text-gradient">Welcome Back</CardTitle>
          <CardDescription id="login-desc" className="text-sm sm:text-base">
            Sign in to continue your AI learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5"
            aria-describedby={`$${
              typeof error === "string" && error ? "login-error-text " : ""
            }login-desc`}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                aria-required="true"
                aria-invalid={!!error}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                aria-required="true"
                aria-invalid={!!error}
                className="text-base"
              />
            </div>
            {error && (
              <Alert
                variant="destructive"
                className="mt-2"
                id="login-error-text"
              >
                <AlertDescription className="text-sm">{error}</AlertDescription>
                {showResend && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      className="touch-target"
                      onClick={async () => {
                        setResendStatus(null);
                        setLoading(true);
                        try {
                          await resendConfirmationEmail(email);
                          setResendStatus(
                            "Confirmation email sent. Please check your inbox."
                          );
                        } catch (err: any) {
                          setResendStatus(
                            "Failed to resend confirmation email."
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Resend Confirmation Email
                    </Button>
                    {resendStatus && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {resendStatus}
                      </div>
                    )}
                  </div>
                )}
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full btn-gradient touch-target text-base"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 sm:mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-medium touch-target inline-block"
              aria-label="Create an account"
            >
              Create one here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
