"use client";

import React, { useState, useEffect, useRef } from "react";
import { Headphones, RefreshCw, Pause, Play, Download, X, Volume2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface ScriptLine {
  speaker: string;
  text: string;
}

interface PodcastStudioProps {
  script: ScriptLine[];
  isLoading: boolean;
  onGenerate: () => void;
  onClose: () => void;
}

export default function PodcastStudio({
  script = [],
  isLoading,
  onGenerate,
  onClose,
}: PodcastStudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  // Speech synthesis playback
  const stopPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentLineIndex(null);
  };

  const playLine = (index: number) => {
    if (!script || index >= script.length) {
      stopPlayback();
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      setIsPlaying(false);
      return;
    }

    setCurrentLineIndex(index);
    const line = script[index];
    const utterance = new SpeechSynthesisUtterance(line.text);

    // Pick alternate voices if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 1) {
      if (line.speaker.toLowerCase().includes("host") || line.speaker.toLowerCase().includes("alex")) {
        utterance.voice = voices[0];
        utterance.pitch = 1.05;
        utterance.rate = 1.02;
      } else {
        utterance.voice = voices[1] || voices[0];
        utterance.pitch = 0.95;
        utterance.rate = 0.98;
      }
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (isPlayingRef.current) playLine(index + 1);
        }, 400);
      }
    };

    utterance.onerror = () => {
      stopPlayback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (script.length === 0) return;
      setIsPlaying(true);
      playLine(currentLineIndex !== null ? currentLineIndex : 0);
    }
  };

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const handleDownloadScript = () => {
    if (script.length === 0) return;
    const content = script.map((s) => `[${s.speaker}]: ${s.text}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NoteWave_Podcast_Script_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Podcast Studio</h2>
            <p className="text-[10px] text-zinc-400">AI Deep-Dive Conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {script.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onGenerate}
              disabled={isLoading}
              className="h-8 w-8 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* EQUALIZER / PLAYER BAR */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-1.5 h-10">
            {[...Array(18)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlaying
                    ? "bg-purple-500 animate-pulse"
                    : "bg-zinc-300 dark:bg-zinc-700 h-1.5"
                }`}
                style={{
                  height: isPlaying ? `${Math.max(8, (Math.sin(i + Date.now()) * 18) + 20)}px` : "6px",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {script.length === 0 ? (
              <Button
                onClick={onGenerate}
                disabled={isLoading}
                className="rounded-full px-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-xs shadow-lg shadow-purple-500/10 hover:opacity-90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Podcast
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePlayback}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadScript}
                  className="rounded-full border-zinc-300 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export Script
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SCRIPT STREAM */}
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Synthesizing Audio Dialogue...</p>
          </div>
        ) : script.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-zinc-400">
            <Headphones className="w-12 h-12 opacity-20" />
            <p className="text-xs max-w-xs">Generate an engaging 2-minute conversation between AI hosts based on your document.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {script.map((line, idx) => {
              const isCurrent = currentLineIndex === idx;
              const isHost = line.speaker.toLowerCase().includes("host") || line.speaker.toLowerCase().includes("alex");
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isPlaying) {
                      playLine(idx);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? "border-purple-500/60 bg-purple-500/10 shadow-lg"
                      : "border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-black uppercase tracking-wider ${
                        isHost ? "text-purple-400 border-purple-500/30" : "text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {line.speaker}
                    </Badge>
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[10px] text-purple-400 font-mono">
                        <Volume2 className="w-3 h-3 animate-pulse" /> Speaking
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{line.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
