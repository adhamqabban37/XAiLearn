"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface NotesPanelProps {
  courseId?: string;
}

/**
 * NotesPanel Component
 *
 * Provides a simple text area for taking notes.
 * Features:
 * - Rich text notes with auto-save to localStorage
 * - Persistent storage per course
 */
export function NotesPanel({
  courseId = "default",
}: NotesPanelProps) {
  const [notes, setNotes] = useState("");

  // Load saved notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes-${courseId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [courseId]);

  // Auto-save notes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes) {
        localStorage.setItem(`notes-${courseId}`, notes);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [notes, courseId]);

  return (
    <Card className="flex flex-col h-full border-accent/20">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <h3 className="font-semibold">Notes</h3>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <Textarea
          placeholder="Take notes while learning..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-full resize-none bg-background border-muted focus-visible:ring-1"
        />
      </div>
    </Card>
  );
}

