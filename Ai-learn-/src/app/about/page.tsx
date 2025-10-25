import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, Target, Users, Rocket, Brain, Award, BookOpen, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "About AI-Learn Platform - AI-Powered Course Generation",
  description: "Learn about AI-Learn Platform: Transform any PDF or document into an interactive AI-powered course in seconds. Discover our mission, features, and how we're revolutionizing online learning.",
  openGraph: {
    title: "About AI-Learn Platform",
    description: "Revolutionizing online learning with AI-powered course generation",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold">AI-Powered Learning Platform</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Transform Any Document Into<br />an Interactive Course
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          AI-Learn Platform uses cutting-edge artificial intelligence to convert PDFs, documents, and text into structured, engaging learning experiences—complete with lessons, quizzes, and video resources.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="btn-gradient">
              <Rocket className="w-5 h-5 mr-2" />
              Try It Free
            </Button>
          </Link>
          <Link href="/ai-info">
            <Button size="lg" variant="outline">
              <Brain className="w-5 h-5 mr-2" />
              AI Information
            </Button>
          </Link>
        </div>
      </div>

      {/* Mission Section */}
      <Card className="mb-12 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl">Our Mission</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-lg leading-relaxed">
          <p className="mb-4">
            We believe that <strong>learning should be accessible, engaging, and personalized</strong>. Traditional online courses take weeks to create and often don't match individual learning needs. PDFs and documents are static and difficult to study from.
          </p>
          <p className="mb-4">
            <strong>AI-Learn Platform solves this problem.</strong> Our mission is to democratize education by making it possible for anyone to create a structured, interactive course from any content in seconds—not weeks.
          </p>
          <p>
            Whether you're a student studying from textbooks, a professional learning from documentation, or a lifelong learner exploring new topics, AI-Learn transforms your materials into an optimized learning experience.
          </p>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">How AI-Learn Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <CardTitle>Upload Content</CardTitle>
            </CardHeader>
            <CardContent>
              Upload a PDF, paste text, or provide a document on any topic. Our AI accepts materials from textbooks, research papers, articles, guides, and more.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <CardTitle>AI Generates Course</CardTitle>
            </CardHeader>
            <CardContent>
              Our AI analyzes the content, extracts key concepts, structures lessons, generates quizzes, and finds relevant video resources—all in under 60 seconds.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <CardTitle>Learn Interactively</CardTitle>
            </CardHeader>
            <CardContent>
              Study through structured lessons, test your knowledge with quizzes, watch supplementary videos, track progress, and earn certificates upon completion.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Powerful Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Intelligent Course Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              AI automatically organizes content into logical modules and lessons, ensuring smooth learning progression from basic to advanced concepts.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                Video Resource Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              Our AI finds and validates relevant YouTube educational videos for each lesson, providing multiple learning modalities.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Adaptive Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              Every lesson includes AI-generated multiple-choice quizzes that reinforce key concepts and test comprehension.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                Progress & Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              Track your learning journey, maintain streaks, earn achievements, and receive certificates upon course completion.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Who It's For */}
      <Card className="mb-12">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl">Who Is AI-Learn For?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">🎓 Students</h3>
              <p className="text-muted-foreground">
                Transform textbooks, lecture notes, and research papers into interactive study materials with quizzes and video resources.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">💼 Professionals</h3>
              <p className="text-muted-foreground">
                Learn from technical documentation, industry reports, and training materials at your own pace with structured lessons.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">📚 Lifelong Learners</h3>
              <p className="text-muted-foreground">
                Convert any interesting article, book, or guide into a personalized course that matches your learning style.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">👨‍🏫 Educators</h3>
              <p className="text-muted-foreground">
                Quickly create supplementary materials, study guides, and interactive courses from existing educational content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology */}
      <Card className="mb-12 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-2xl">Built With Cutting-Edge Technology</CardTitle>
          <CardDescription>Powered by the latest AI models and modern web technologies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="font-bold text-primary">•</span>
            <div>
              <strong>AI Models:</strong> DeepSeek, Google Gemini, and Ollama for intelligent course generation
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-primary">•</span>
            <div>
              <strong>Modern Stack:</strong> Next.js 15, React 19, TypeScript for fast, reliable performance
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-primary">•</span>
            <div>
              <strong>Secure Backend:</strong> Firebase Authentication and Supabase for data protection
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold text-primary">•</span>
            <div>
              <strong>Smart Integrations:</strong> YouTube API validation, PDF parsing, and content analysis
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="text-center bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardHeader>
          <CardTitle className="text-3xl mb-2">Ready to Transform Your Learning?</CardTitle>
          <CardDescription className="text-lg">
            Join thousands of learners who are already using AI to study smarter, not harder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="btn-gradient">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/faq">
              <Button size="lg" variant="outline">
                View FAQ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "AI-Learn Platform",
            "description": "AI-powered platform that transforms documents into interactive courses",
            "url": "https://your-domain.com",
            "logo": "https://your-domain.com/logo.png",
            "sameAs": [
              "https://twitter.com/AILearnPlatform",
              "https://linkedin.com/company/ailearn"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Support",
              "email": "support@your-domain.com"
            }
          })
        }}
      />
    </div>
  );
}
