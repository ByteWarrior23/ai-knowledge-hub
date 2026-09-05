"use client";

import React, { useState, useEffect } from "react";
import { Mic, X, Waves, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceStudioProps {
  onClose: () => void;
  onTranscription: (text: string) => void;
}

export default function VoiceStudio({ onClose, onTranscription }: VoiceStudioProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-US";

        recog.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recog.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  }, []);

  const toggleListen = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge or type your question.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      if (transcript.trim()) {
        onTranscription(transcript);
      }
    } else {
      setTranscript("");
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onTranscription(transcript.trim());
      setTranscript("");
      if (isListening && recognition) {
        recognition.stop();
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Voice Immersion</h2>
            <p className="text-[10px] text-zinc-400">Real-Time Speech Interaction</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
        <div className="relative">
          <div
            className={`absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transition-transform duration-500 ${
              isListening ? "scale-150 opacity-100" : "scale-75 opacity-0"
            }`}
          />
          <Button
            onClick={toggleListen}
            className={`h-32 w-32 rounded-full relative z-10 transition-all duration-500 shadow-2xl ${
              isListening
                ? "bg-blue-600 scale-105 shadow-blue-500/50"
                : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90"
            }`}
          >
            {isListening ? <Waves className="w-12 h-12 animate-pulse" /> : <Mic className="w-12 h-12" />}
          </Button>
        </div>

        <div className="text-center space-y-2 max-w-xs">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {isListening ? "Listening... Speak now" : "Tap to Speak"}
          </h3>
          <p className="text-xs text-zinc-500">
            {isListening
              ? "Speech is transcribed in real-time. Tap again or send to query."
              : "Ask questions or give commands verbally to your document."}
          </p>
        </div>

        {transcript && (
          <div className="w-full max-w-sm p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <p className="text-xs italic text-zinc-300 leading-relaxed">"{transcript}"</p>
            <Button
              onClick={handleSend}
              className="w-full rounded-xl h-9 bg-white text-black font-semibold text-xs"
            >
              Send to Copilot
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
