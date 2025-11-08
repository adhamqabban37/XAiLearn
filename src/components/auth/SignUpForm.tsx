"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/authSupabase";
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
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    const trimmedName = displayName.trim();

    if (trimmedPassword !== trimmedConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(trimmedEmail, trimmedPassword, trimmedName);
      router.push("/dashboard");
    } catch (error: any) {
      let message = "Failed to create account";
      if (typeof error === "string") {
        message = error;
      } else if (error && typeof error === "object" && "message" in error) {
        message = (error as any).message;
      }
      console.error("Signup error:", message, error);
      let friendly = "Failed to create account";
      if (/supabase client is not initialized/i.test(message)) {
        friendly =
          "There was a problem connecting to the authentication service. Please try again later or contact support.";
      } else if (/rate/i.test(message) || /too many/i.test(message)) {
        friendly = "Too many attempts. Please wait and try again.";
      } else if (/email/i.test(message) && /exists|already/i.test(message)) {
        friendly = "Email already in use.";
      } else if (/email/i.test(message) && /invalid/i.test(message)) {
        friendly = "Invalid email format.";
      } else if (/password/i.test(message) && /weak|short/i.test(message)) {
        friendly = "Password is too weak.";
      } else if (/confirm your email/i.test(message)) {
        friendly = "Please confirm your email to complete signup.";
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6"
      suppressHydrationWarning
    >
      <Card className="w-full max-w-md circuit-bg border-accent/30 glow-subtle">
        <CardHeader className="text-center space-y-2 sm:space-y-3 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl text-gradient">
            Create Account
          </CardTitle>
          <CardDescription id="signup-desc" className="text-sm sm:text-base">
            Join the AI learning platform and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5"
            aria-describedby={`${
              typeof error === "string" && error ? "signup-error-text " : ""
            }signup-desc`}
          >
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm sm:text-base">Full Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Enter your full name"
                aria-required="true"
                aria-invalid={!!error}
                className="text-base"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                aria-required="true"
                aria-invalid={!!error}
                className="text-base"
              />
            </div>

            {error && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertDescription id="signup-error-text" className="text-sm">
                  {error}
                </AlertDescription>
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium touch-target inline-block"
              aria-label="Sign in"
            >
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
