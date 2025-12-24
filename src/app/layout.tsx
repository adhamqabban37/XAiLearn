import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/common/header";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Inter } from "next/font/google";
import { AeoGeoHead, AeoGeoBody } from "@/components/seo/AeoGeoBlock";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default:
      "AI-Learn Platform - Transform PDFs into Interactive Courses with AI",
    template: "%s | AI-Learn Platform",
  },
  description:
    "Create AI-powered interactive courses from any PDF or document in seconds. Upload your materials and get structured lessons, quizzes, and video resources instantly. Free AI course generator for students, professionals, and lifelong learners.",
  keywords: [
    "AI course generator",
    "PDF to course",
    "AI learning platform",
    "online course creator",
    "interactive learning",
    "AI education",
    "document to course",
    "study from PDF",
    "AI-powered learning",
    "course generation AI",
    "educational AI",
    "learn faster with AI",
    "automatic course creation",
    "AI study tool",
    "best online education platform",
    "how to learn anything fast",
  ],
  authors: [{ name: "AI-Learn Platform Team" }],
  creator: "AI-Learn Platform",
  publisher: "AI-Learn Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "AI-Learn Platform - Transform PDFs into Interactive Courses",
    description:
      "Create AI-powered interactive courses from any PDF or document in seconds. Get structured lessons, quizzes, and video resources instantly.",
    siteName: "AI-Learn Platform",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "AI-Learn Platform Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Learn Platform - Transform PDFs into Interactive Courses",
    description:
      "Create AI-powered interactive courses from any PDF or document in seconds.",
    images: ["/logo.svg"],
    creator: "@AILearnPlatform", // Update with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    // Rely on App Router dynamic icon routes at /icon and /apple-icon
    icon: "/icon",
    apple: "/apple-icon",
  },
  manifest: "/site.webmanifest",
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Mobile-first viewport meta tag for responsive design */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />
        {/* AEO/GEO JSON-LD: Update values below to match your brand and course */}
        {(() => {
          const aeo = {
            brandName: "BRAND_NAME", // TODO: e.g., "XAi Learning"
            courseTitle: "COURSE_TITLE", // TODO: e.g., "AI Foundations & Prompt Engineering"
            audience: "TARGET_AUDIENCE", // TODO: e.g., "beginners, students, job-seekers, small-business owners"
            cityRegion: "CITY, STATE", // TODO: e.g., "Dallas, TX"
            neighborhoods: ["Irving", "Las Colinas", "Valley Ranch", "DFW"],
            outcomes: [
              "prompt engineering",
              "Python basics",
              "AI tools",
              "ethics",
            ],
            siteUrl: "SITE_URL", // TODO: e.g., "https://www.example.com"
            courseUrl: "SITE_URL/courses/course-slug", // optional deep link
            sameAs: [
              // TODO: Add your social/profile URLs
              "https://twitter.com/yourbrand",
              "https://www.linkedin.com/company/yourbrand/",
            ],
            inLanguage: "en",
            timeRequired: "P2W", // ISO 8601 duration (e.g., P2W = approx. two weeks)
            price: { free: true } as const, // or { amount: 99, currency: "USD" }
            credential: "Certificate of Completion",
          };
          return <AeoGeoHead {...aeo} />;
        })()}
      </head>
      <body
        className={`font-sans antialiased min-h-screen flex flex-col ${inter.variable}`}
      >
        {/* Skip link for keyboard and screen readers */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <AuthProvider>
          {/* Site header (landmark) */}
          <Header />
          {/* Main content landmark with programmatic focus target */}
          <main
            id="main-content"
            tabIndex={-1}
            role="main"
            className="flex-1 focus:outline-none"
          >
            {children}
          </main>
          {/* AEO/GEO Hidden Educational Section (crawlable, screen-reader accessible). Update values above in the same config. */}
          {(() => {
            const aeo = {
              brandName: "BRAND_NAME",
              courseTitle: "COURSE_TITLE",
              audience: "TARGET_AUDIENCE",
              cityRegion: "CITY, STATE",
              neighborhoods: ["Irving", "Las Colinas", "Valley Ranch", "DFW"],
              outcomes: [
                "prompt engineering",
                "Python basics",
                "AI tools",
                "ethics",
              ],
              siteUrl: "SITE_URL",
              courseUrl: "SITE_URL/courses/course-slug",
              sameAs: [
                "https://twitter.com/yourbrand",
                "https://www.linkedin.com/company/yourbrand/",
              ],
              inLanguage: "en",
              timeRequired: "P2W",
              price: { free: true } as const,
              credential: "Certificate of Completion",
            };
            return <AeoGeoBody {...aeo} />;
          })()}
          {/* Global polite live region for announcements (screen reader only) */}
          <div aria-live="polite" aria-atomic="true" className="sr-only" />
          <Toaster />

          {/* Footer */}
          <footer className="mt-auto py-6 text-center text-sm text-muted-foreground border-t">
            <p>© {new Date().getFullYear()} by QAB Global LLC</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
