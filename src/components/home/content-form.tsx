"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UploadCloud,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Clock,
  ArrowRight,
  Wand2,
} from "lucide-react";
import {
  generateCourseFromText,
  generateQuizFromText,
  getQuizPapers,
  generateQuizFromPaper,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingBar } from "@/components/ui/loading-bar";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { Course } from "@/lib/types";

const formSchema = z.object({
  text: z.string().optional(),
  topic: z.string().optional(),
  duration: z.enum(["short", "medium", "long"]).default("medium"),
});

interface ContentFormProps {
  onCourseGenerated: (course: Course) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export function ContentForm({
  onCourseGenerated,
  setIsLoading,
  isLoading,
}: ContentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [mode, setMode] = useState<"course" | "quiz">("course");
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      topic: "",
      duration: "medium",
    },
  });

  // Fetch quiz papers when entering quiz mode
  useEffect(() => {
    if (mode === "quiz") {
      getQuizPapers()
        .then(setPapers)
        .catch((err) => console.error("Failed to load quiz papers:", err));
    }
  }, [mode]);

  const handleQuizStart = async () => {
    if (!selectedPaperId) return;
    setIsLoading(true);
    try {
      const result = await generateQuizFromPaper(selectedPaperId);
      if ("error" in result) {
        setError(result.error);
      } else {
        onCourseGenerated(result);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setFileName(file.name);
        onPdfSubmit(file);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  // Watch for topic changes to update the prompt
  const topic = form.watch("topic");
  const duration = form.watch("duration");
  const textValue = form.watch("text");

  const finalPrompt = topic
    ? `Create a ${duration} course about "${topic}". Include key concepts, practical examples, and a quiz.`
    : "Enter a topic to see the prompt...";

  const handleCopyToClipboard = () => {
    if (finalPrompt) {
      navigator.clipboard.writeText(finalPrompt);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    }
  };

  const handleTextSubmit = async () => {
    const text = form.getValues("text");
    if (!text || text.length < 100) {
      form.setError("text", {
        message: "Please enter at least 100 characters.",
      });
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (mode === "quiz") {
        result = await generateQuizFromText(text);
      } else {
        result = await generateCourseFromText(text, duration);
      }

      if (result && "error" in result) {
        setError(result.error);
      } else if (result) {
        await handleCourseGenerated(result);
      }
    } catch (e: any) {
      setError(e.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseGenerated = async (course: Course) => {
    // Save to local storage
    if (typeof window !== "undefined") {
      try {
        const savedCourses = localStorage.getItem("ai-learn-courses");
        const courses = savedCourses ? JSON.parse(savedCourses) : [];

        // Check if course already exists
        const existingIndex = courses.findIndex((c: Course) => c.course_title === course.course_title);

        if (existingIndex >= 0) {
          courses[existingIndex] = course;
        } else {
          courses.push(course);
        }

        localStorage.setItem("ai-learn-courses", JSON.stringify(courses));

        // Also save to current course
        localStorage.setItem("ai-learn-current-course", JSON.stringify(course));

        // Trigger storage event for other components
        window.dispatchEvent(new Event("storage"));
      } catch (error) {
        console.error("Error saving course:", error);
      }
    }

    // Always call the original handler
    onCourseGenerated(course);
  };

  const onPdfSubmit = async (file: File) => {
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    setProcessingStep("Reading PDF...");

    try {
      setUploadProgress(10);
      const formData = new FormData();
      formData.append("file", file);
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), 25_000);

      setUploadProgress(25);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }).finally(() => clearTimeout(to));

      setUploadProgress(40);
      if (!res.ok) {
        let msg = `Failed to upload/parse PDF (status ${res.status}).`;
        try {
          const err = await res.json();
          if (err?.error) msg = err.error;
        } catch { }
        throw new Error(msg);
      }
      const parsed = await res.json();
      let text: string = parsed?.text || "";
      if (!text || text.trim().length < 50) {
        throw new Error(
          "The PDF content is too short or could not be extracted. Please try uploading a longer PDF with more text content."
        );
      }

      setUploadProgress(50);
      setProcessingStep("Generating course with AI...");

      const MAX_CHARS = 100000;
      if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

      setUploadProgress(70);
      const pdfVideos = parsed?.videos || [];
      console.log(`🎥 Passing ${pdfVideos.length} videos from PDF to course generation`);

      let result;
      if (mode === "quiz") {
        result = await generateQuizFromText(text);
      } else {
        result = await generateCourseFromText(
          text,
          form.getValues("duration"),
          pdfVideos
        );
      }

      setUploadProgress(90);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result) {
        await handleCourseGenerated(result);
        setUploadProgress(100);
        setProcessingStep("Course generated successfully!");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (e: any) {
      setError(e?.message || "There was an error processing your PDF.");
      setUploadProgress(0);
    }

    setIsLoading(false);
    setProcessingStep(null);
    setUploadProgress(0);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card/80 border-accent/30 circuit-bg glow-subtle p-4 sm:p-6 md:p-8 rounded-xl relative overflow-hidden elevation-2">
      {isLoading && (
        <div className="mb-4 sm:mb-6">
          <LoadingBar
            progress={uploadProgress}
            status={processingStep || "Processing..."}
            visible={isLoading}
            variant="inline"
          />
        </div>
      )}
      <Form {...form}>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex justify-center gap-4 mb-6">
            <div className="bg-muted/50 p-1 rounded-lg flex items-center">
              <Button
                type="button"
                variant={mode === "course" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("course")}
                className="text-sm font-medium"
              >
                Course Mode
              </Button>
              <Button
                type="button"
                variant={mode === "quiz" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("quiz")}
                className="text-sm font-medium"
              >
                Quiz Mode
              </Button>
            </div>
          </div>

          {mode === "course" && (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center gap-2 font-headline">
                  <Wand2 className="text-primary h-5 w-5 sm:h-6 sm:w-6" /> Craft with a prompt
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Generate course material with this powerful prompt, then bring it
                  back here.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2 space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Sparkles className="absolute left-3 w-5 h-5 text-muted-foreground" />
                            <Input
                              placeholder="Enter your course topic..."
                              {...field}
                              className="pl-10 text-base py-5 sm:py-6 bg-background"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="space-y-2 sm:space-y-3 bg-background rounded-lg border p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
                          <Label className="font-bold text-sm sm:text-base">
                            How long should the course be?
                          </Label>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex justify-between gap-2"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0 touch-target">
                              <FormControl>
                                <RadioGroupItem value="short" />
                              </FormControl>
                              <Label className="font-normal text-sm sm:text-base cursor-pointer">Short</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0 touch-target">
                              <FormControl>
                                <RadioGroupItem value="medium" />
                              </FormControl>
                              <Label className="font-normal text-sm sm:text-base cursor-pointer">Medium</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0 touch-target">
                              <FormControl>
                                <RadioGroupItem value="long" />
                              </FormControl>
                              <Label className="font-normal text-sm sm:text-base cursor-pointer">Long</Label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button
                    onClick={handleCopyToClipboard}
                    className="w-full btn-gradient shadow-md hover:shadow-lg transition-all touch-target text-base"
                    size="lg"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Prompt
                  </Button>
                </div>
                <div className="md:col-span-3">
                  <div className="h-full max-h-56 overflow-y-auto bg-background rounded-md p-3 sm:p-4 border relative">
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap font-code leading-relaxed">
                      {finalPrompt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center text-muted-foreground text-xs sm:text-sm before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border before:mr-3 sm:before:mr-4 after:ml-3 sm:after:ml-4">
                Or upload a PDF
              </div>

              <div className="space-y-4 text-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 sm:pt-4">
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-xl p-6 sm:p-8 md:p-10 text-center cursor-pointer transition-all duration-300
                      flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px] gap-3 sm:gap-4
                      ${isDragActive
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-accent/5"
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="bg-primary/10 p-3 sm:p-4 rounded-full mb-2">
                      <UploadCloud className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <p className="mt-2 font-semibold text-foreground text-sm sm:text-base px-2">
                      {isLoading
                        ? processingStep || "Processing..."
                        : fileName ||
                        (isDragActive
                          ? "Drop the PDF here!"
                          : "Upload or Drag & Drop a PDF")}
                    </p>
                    <p className="text-xs text-muted-foreground px-2">
                      The AI will read the file and build a course
                    </p>
                    {fileName && (
                      <p className="text-xs text-primary font-medium mt-1">
                        Ready to process
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem className="h-full">
                        <FormControl>
                          <div className="relative h-full min-h-[200px] sm:min-h-[240px]">
                            <Textarea
                              placeholder="Or paste your text here..."
                              className="h-full resize-none p-4 sm:p-6 text-sm sm:text-base rounded-xl border-border focus:border-primary transition-all"
                              {...field}
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4"
                              disabled={!field.value || isLoading}
                              onClick={handleTextSubmit}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </>
          )}

          {mode === "quiz" && (
            <div className="max-w-md mx-auto space-y-6 py-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Select a Quiz Paper</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a pre-loaded question bank to start your quiz.
                </p>
              </div>

              <div className="space-y-4">
                <select
                  className="w-full p-3 rounded-lg border border-border bg-background"
                  value={selectedPaperId || ""}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                >
                  <option value="">-- Select a Paper --</option>
                  {papers.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.title} ({paper.questionCount} questions)
                    </option>
                  ))}
                </select>

                <Button
                  className="w-full btn-gradient"
                  size="lg"
                  disabled={!selectedPaperId || isLoading}
                  onClick={handleQuizStart}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Quiz...
                    </>
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
              </div>

              <div className="relative flex items-center text-muted-foreground text-xs sm:text-sm before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border before:mr-3 sm:before:mr-4 after:ml-3 sm:after:ml-4">
                Or upload your own PDF
              </div>

              {/* Upload area for Quiz Mode */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300
                  flex flex-col items-center justify-center min-h-[160px] gap-3
                  ${isDragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-accent/5"
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="bg-primary/10 p-3 rounded-full mb-2">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-2 font-semibold text-foreground text-sm px-2">
                  {isLoading && !selectedPaperId
                    ? processingStep || "Processing..."
                    : fileName ||
                    (isDragActive
                      ? "Drop the PDF here!"
                      : "Upload or Drag & Drop a PDF")}
                </p>
                <p className="text-xs text-muted-foreground px-2">
                  We will extract every question found in the PDF.
                </p>
              </div>
            </div>
          )}
        </div>
      </Form>

      {error && (
        <Alert variant="destructive" className="mt-4 sm:mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm sm:text-base">Oops! Something went wrong.</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
