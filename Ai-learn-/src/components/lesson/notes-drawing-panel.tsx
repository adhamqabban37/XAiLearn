"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  FileText,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesDrawingPanelProps {
  courseId?: string;
}

type DrawingTool = "pen" | "eraser";

interface DrawingState {
  paths: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
    tool: DrawingTool;
  }>;
}

/**
 * NotesDrawingPanel Component
 *
 * Provides a tabbed interface for taking notes and drawing/sketching.
 * Features:
 * - Rich text notes with auto-save to localStorage
 * - Canvas-based drawing with pen and eraser tools
 * - Color picker for drawing
 * - Undo/redo functionality
 * - Download drawing as image
 * - Persistent storage per course
 */
export function NotesDrawingPanel({
  courseId = "default",
}: NotesDrawingPanelProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "draw">("notes");
  const [notes, setNotes] = useState("");
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");
  const [currentColor, setCurrentColor] = useState("#0066FF");
  const [brushSize, setBrushSize] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingState, setDrawingState] = useState<DrawingState>({ paths: [] });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [drawingHistory, setDrawingHistory] = useState<DrawingState[]>([]);

  // Load saved notes and drawing from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes-${courseId}`);
    const savedDrawing = localStorage.getItem(`drawing-${courseId}`);

    if (savedNotes) {
      setNotes(savedNotes);
    }

    if (savedDrawing) {
      try {
        const parsed = JSON.parse(savedDrawing);
        setDrawingState(parsed);
        setDrawingHistory([parsed]);
        setHistoryIndex(0);
      } catch (e) {
        console.error("Failed to parse saved drawing:", e);
      }
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

  // Redraw canvas when state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    drawingState.paths.forEach((path) => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.tool === "eraser" ? "#ffffff" : path.color;
      ctx.lineWidth = path.tool === "eraser" ? path.width * 3 : path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }

      ctx.stroke();
    });
  }, [drawingState]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      // Trigger redraw
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getCanvasPoint(e);

    const newPath = {
      points: [point],
      color: currentColor,
      width: brushSize,
      tool: currentTool,
    };

    const newState = {
      paths: [...drawingState.paths, newPath],
    };

    setDrawingState(newState);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getCanvasPoint(e);

    setDrawingState((prev) => {
      const paths = [...prev.paths];
      const currentPath = paths[paths.length - 1];

      if (currentPath) {
        currentPath.points.push(point);
      }

      return { paths };
    });
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);

      // Save to history
      const newHistory = drawingHistory.slice(0, historyIndex + 1);
      newHistory.push(drawingState);
      setDrawingHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Save to localStorage
      localStorage.setItem(`drawing-${courseId}`, JSON.stringify(drawingState));
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDrawingState(drawingHistory[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDrawingState(drawingHistory[newIndex]);
    }
  };

  const clearCanvas = () => {
    const newState = { paths: [] };
    setDrawingState(newState);
    setDrawingHistory([newState]);
    setHistoryIndex(0);
    localStorage.setItem(`drawing-${courseId}`, JSON.stringify(newState));
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `drawing-${courseId}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = [
    "#0066FF", // Primary blue
    "#00D4FF", // Cyan
    "#FF6B35", // Orange
    "#000000", // Black
    "#EF4444", // Red
    "#10B981", // Green
    "#8B5CF6", // Purple
    "#F59E0B", // Yellow
  ];

  return (
    <Card className="flex flex-col h-full border-accent/20">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="flex flex-col h-full"
      >
        <div className="p-4 border-b border-border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Draw
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notes" className="flex-1 m-0 p-4 overflow-hidden">
          <Textarea
            placeholder="Take notes while learning..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-full resize-none bg-background border-muted focus-visible:ring-1"
          />
        </TabsContent>

        <TabsContent
          value="draw"
          className="flex-1 m-0 flex flex-col overflow-hidden"
        >
          <div className="p-3 border-b border-border space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={currentTool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("pen")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= drawingHistory.length - 1}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadDrawing}>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Color:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      currentColor === color
                        ? "border-foreground scale-110"
                        : "border-muted hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Size:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs font-medium w-6">{brushSize}</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full border border-border rounded-lg bg-white cursor-crosshair"
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
