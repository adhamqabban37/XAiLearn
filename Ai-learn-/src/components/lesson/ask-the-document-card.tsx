"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { HelpCircleIcon } from "../ui/icons";

export function AskTheDocumentCard() {
    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [answer, setAnswer] = useState("");

    const handleAskQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;
        
        setIsLoading(true);
        setAnswer("");
        // Simulate AI response
        setTimeout(() => {
            setAnswer(`Based on the document, the answer to "${question}" appears to be related to the section on page 3 regarding key principles. The document states that... (This is a simulated AI response).`);
            setIsLoading(false);
            setQuestion("");
        }, 1500);
    };

    return (
        <Card className="bg-secondary/50 border-secondary shadow-sm">
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="text-secondary-foreground/80">
                    <HelpCircleIcon className="w-8 h-8" />
                </div>
                <div>
                    <CardTitle className="text-lg">Ask the Document</CardTitle>
                    <CardDescription>Have a question? Get an answer from your document.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <Input 
                        placeholder="e.g., What are the main takeaways?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </form>
                {isLoading && (
                    <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                    </div>
                )}
                {answer && (
                    <div className="mt-4 p-4 bg-background/70 rounded-md border text-sm">
                        {answer}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
