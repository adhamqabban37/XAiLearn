"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "../ui/button";
import { BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container flex h-14 sm:h-16 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo - always visible */}
        <div className="mr-2 sm:mr-4 flex">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label="Home"
          >
            <Logo alt="AI Course Crafter Home" />
          </Link>
        </div>

        {/* Desktop Navigation - hidden on mobile */}
        <nav className="hidden md:flex flex-1 items-center justify-end space-x-2" aria-label="Primary">
          <Button variant="ghost" size="sm" asChild className="touch-target">
            <Link href="/dashboard" aria-label="Go to dashboard">
              <BookOpen className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="touch-target">
            <Link href="/login" aria-label="Sign in">
              Sign In
            </Link>
          </Button>
        </nav>

        {/* Mobile Menu - Sheet component for slide-out menu */}
        <div className="flex md:hidden flex-1 items-center justify-end">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="touch-target no-select"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                <Button
                  variant="ghost"
                  size="lg"
                  asChild
                  className="justify-start touch-target"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/dashboard">
                    <BookOpen className="h-5 w-5 mr-3" />
                    Dashboard
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="justify-start touch-target"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
