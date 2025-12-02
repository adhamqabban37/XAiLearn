"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  FileText,
  AlertCircle,
  UploadCloud,
  Sparkles,
  Copy,
  Wand2,
  Clock,
} from "lucide-react";
import { generateCourseFromText, generateQuizFromText } from "@/app/actions";
import { saveCourse } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Course } from "@/lib/types";
import { Card } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { promptTemplate } from "@/lib/prompt-template";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { LoadingBar } from "../ui/loading-bar";

const formSchema = z.object({
  topic: z.string().optional(),
  duration: z.string().optional(),
  text: z.string().optional(),
  url: z.string().url({ message: "Please enter a valid URL." }).optional(),
});

interface ContentFormProps {
  onCourseGenerated: (course: Course) => void;
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export function ContentForm({
  onCourseGenerated,
  setIsLoading,
  isLoading,
}: ContentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState<"course" | "quiz">("course");
  const { toast } = useToast();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      duration: "medium",
      text: "",
      url: "",
    },
  });

  const topic = form.watch("topic");
  const duration = form.watch("duration");
  const textValue = form.watch("text");

  const finalPrompt = promptTemplate
    .replace(
      "[TEXT_TO_ANALYZE_WILL_BE_INSERTED_HERE]",
      topic || "your topic of choice"
    )
    .replace("[COURSE_LENGTH_HERE]", duration || "medium");

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(finalPrompt);
    toast({
      title: "Prompt Copied!",
      description: "You can now paste this into your favorite AI tool.",
    });
  };

  const handleCourseGenerated = async (course: Course) => {
    // Save course for authenticated users using client-side Supabase session (RLS)
    if (user) {
      try {
        const id = await saveCourse(user.id, course);
        if (typeof id === "string") {
          toast({
            title: "Course Saved!",
            description: "Your course has been saved to your dashboard.",
          });
        }
      } catch (error) {
        console.error("Error saving course:", error);
      }
    }

    // Always call the original handler
    onCourseGenerated(course);
  };


  async function onTextSubmit() {
    const values = form.getValues();
    if (!values.text || values.text.length < 100) {
      form.setError("text", {
        message: "Please enter at least 100 characters.",
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    let result;
    if (mode === "quiz") {
      result = await generateQuizFromText(values.text);
    } else {
      result = await generateCourseFromText(values.text, values.duration);
    }
    setIsLoading(false);
    setIsPasting(false);

    if (result && "error" in result) {
      setError(result.error);
    } else if (result) {
      await handleCourseGenerated(result);
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      await onPdfSubmit(file);
    }
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

    // Step 1: Parse PDF via API route (fast)
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
      if (!text || text.trim().length < 100) {
        throw new Error(
          "The PDF content is too short or could not be extracted. Please try a different PDF."
        );
      }

      setUploadProgress(50);
      setProcessingStep("Generating course with AI...");

      // Step 2: Cap long text and call AI
      const MAX_CHARS = 100000; // Increased to handle larger PDFs (approx 25k words)
      if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

      setUploadProgress(70);
      // Pass videos extracted from PDF to course generation
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
        // Brief delay to show completion
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // This is necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      onPdfSubmit(file);
    } else {
      setError("Please drop a valid PDF file.");
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
            </>
          )}

          <div className="space-y-4 text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 sm:pt-4">
              <div
                className="relative border-2 border-dashed border-muted/30 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors flex flex-col justify-center items-center min-h-[160px] sm:h-40 touch-target data-[dragging-over=true]:border-primary data-[dragging-over=true]:bg-primary/10"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                data-dragging-over={isDraggingOver}
              >
                <UploadCloud className="mx-auto h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                <p className="mt-2 font-semibold text-foreground text-sm sm:text-base px-2">
                  {isLoading
                    ? processingStep || "Processing..."
                    : fileName ||
                    (isDraggingOver
                      ? "Drop the PDF here!"
                      : "Upload or Drag & Drop a PDF")}
                </p>
                <p className="text-xs text-muted-foreground px-2">
                  The AI will read the file and build a {mode === "quiz" ? "quiz" : "course"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="min-h-[160px] sm:h-40">
                    {!isPasting ? (
                      <div
                        className="relative border-2 border-dashed border-muted/30 rounded-lg p-4 sm:p-6 text-center cursor-text hover:border-primary hover:bg-muted/50 transition-colors h-full flex flex-col justify-center touch-target"
                        onClick={() => setIsPasting(true)}
                      >
                        <FileText className="mx-auto h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        <p className="mt-2 font-semibold text-foreground text-sm sm:text-base">
                          Paste Text
                        </p>
                        <p className="text-xs text-muted-foreground px-2">
                          Paste any text to get started
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 h-full">
                        <FormControl>
                          <Textarea
                            id="paste-text-area"
                            placeholder="Paste your messy course notes, lesson plans, or document text here..."
                            className="min-h-[120px] sm:min-h-[100px] text-base flex-1"
                            {...field}
                            autoFocus
                          />
                        </FormControl>
                        {textValue && textValue.length > 100 && (
                          <Button
                            type="button"
                            onClick={onTextSubmit}
                            disabled={isLoading}
                            size="sm"
                            className="btn-gradient shadow-md hover:shadow-lg transition-all touch-target text-base"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              "Generate from Text"
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
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
