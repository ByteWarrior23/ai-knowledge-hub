"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, RefreshCw, X, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SummaryStudioProps {
  summary: string;
  isLoading: boolean;
  onGenerate: () => void;
  onClose: () => void;
}

export default function SummaryStudio({
  summary,
  isLoading,
  onGenerate,
  onClose,
}: SummaryStudioProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Executive Summary</h2>
            <p className="text-[10px] text-zinc-400">5-Point Document Synthesis</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {summary && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8 text-zinc-400 hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onGenerate}
                disabled={isLoading}
                className="h-8 w-8 text-zinc-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Synthesizing Executive Brief...</p>
          </div>
        ) : !summary ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-zinc-400">
            <BookOpen className="w-12 h-12 opacity-20" />
            <p className="text-xs max-w-xs">Extract a comprehensive 5-point executive summary from the document.</p>
            <Button onClick={onGenerate} className="rounded-full px-6 bg-white text-black font-semibold text-xs">
              Generate Summary
            </Button>
          </div>
        ) : (
          <div className="markdown-content prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
