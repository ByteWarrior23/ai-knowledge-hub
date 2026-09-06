"use client";

import React from "react";
import { MessageSquare, RefreshCw, Loader2, Bot, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RESEARCH_AGENTS } from "@/lib/agents";

export interface DebateTurn {
  agent: string;
  text: string;
}

interface DebateStudioProps {
  transcript: DebateTurn[];
  isLoading: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export default function DebateStudio({
  transcript = [],
  isLoading,
  onRestart,
  onClose,
}: DebateStudioProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Agentic Debate</h2>
            <p className="text-[10px] text-zinc-400">Multi-Persona Research Arena</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {transcript.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRestart}
              disabled={isLoading}
              className="h-8 w-8 icon-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 icon-btn">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* TRANSCRIPT */}
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Orchestrating Debate Arena...</p>
          </div>
        ) : transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-zinc-400">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-xs max-w-xs">Simulate a multi-persona debate between Dr. Skeptic, The Weaver, and Veritas.</p>
            <Button onClick={onRestart} className="rounded-full px-6 bg-white text-black font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Start Debate
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {transcript.map((turn, i) => {
              const agentKey = (turn.agent || "").toUpperCase();
              const agent =
                RESEARCH_AGENTS[agentKey] ||
                (agentKey.includes("CRITIC") || agentKey.includes("SKEPTIC")
                  ? RESEARCH_AGENTS.CRITIC
                  : agentKey.includes("SYNTH") || agentKey.includes("WEAVER")
                  ? RESEARCH_AGENTS.SYNTHESIZER
                  : RESEARCH_AGENTS.FACT_CHECKER);

              return (
                <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${agent.color}15`,
                      borderColor: `${agent.color}40`,
                    }}
                  >
                    <Bot className="w-4 h-4" style={{ color: agent.color }} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: agent.color }}>
                        {agent.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">
                        • {agent.role}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {turn.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
