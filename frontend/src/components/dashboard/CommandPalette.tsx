"use client";

import React from "react";
import { Command } from "@/lib/commands";

interface CommandPaletteProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (cmd: Command) => void;
}

export default function CommandPalette({
  commands,
  selectedIndex,
  onSelect,
}: CommandPaletteProps) {
  if (commands.length === 0) return null;

  return (
    <div className="absolute bottom-full mb-3 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-2 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between px-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Studio Commands
        </span>
        <span className="text-[9px] text-zinc-500 dark:text-zinc-600 font-mono">
          ↑↓ to navigate • Enter to run
        </span>
      </div>
      <div className="p-1.5 max-h-64 overflow-y-auto space-y-0.5">
        {commands.map((cmd, i) => {
          const Icon = cmd.icon;
          const isSelected = selectedIndex === i;
          return (
            <div
              key={cmd.id}
              onClick={() => onSelect(cmd)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                isSelected
                  ? "studio-selected"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isSelected
                    ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className={`font-semibold ${isSelected ? "" : "text-zinc-800 dark:text-zinc-200"}`}>
                  {cmd.label}
                </span>
                <span className="text-[10px] text-zinc-500">{cmd.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
