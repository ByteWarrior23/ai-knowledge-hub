"use client";

import React, { useState } from "react";
import { 
  Settings2, Activity, BrainCircuit, Zap, 
  ShieldCheck, Bell, Key, X, Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface SettingsStudioProps {
  settings: {
    focusMode: boolean;
    autoAudit: boolean;
    spacedRepetition: boolean;
  };
  apiKey: string;
  onUpdateSettings: (newSettings: any) => void;
  onUpdateApiKey: (key: string) => void;
  onClose: () => void;
}

export default function SettingsStudio({
  settings,
  apiKey,
  onUpdateSettings,
  onUpdateApiKey,
  onClose,
}: SettingsStudioProps) {
  const [tempKey, setTempKey] = useState(apiKey);
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  const handleToggle = (key: string) => {
    onUpdateSettings({ ...settings, [key]: !settings[key as keyof typeof settings] });
  };

  const handleSaveKey = () => {
    onUpdateApiKey(tempKey);
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Preferences</h2>
            <p className="text-[10px] text-zinc-400">Settings & AI Configuration</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 icon-btn">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8 pb-10">
          {/* BIO-ADAPTIVE PROFILE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bio-Adaptive Profile</h3>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Kinesthetic Research Flow</span>
                </div>
                <Badge variant="outline" className="text-[8px] h-4 border-purple-500/30 text-purple-400">
                  Active
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
                  <span>Cognitive Load</span>
                  <span>32% (Balanced)</span>
                </div>
                <Progress value={32} className="h-1 bg-zinc-800" />
              </div>
            </div>
          </div>

          {/* APPLICATION CONTROLS */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Application Controls</h3>
            <div className="space-y-2">
              <ControlItem
                icon={<Zap className="w-4 h-4 text-amber-400" />}
                title="Focus Mode"
                desc="Mutes sidebars and highlights active dialogue"
                checked={settings.focusMode}
                onCheckedChange={() => handleToggle("focusMode")}
              />
              <ControlItem
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
                title="Auto-Audit on Upload"
                desc="Automatically runs Verified Vault on new PDFs"
                checked={settings.autoAudit}
                onCheckedChange={() => handleToggle("autoAudit")}
              />
              <ControlItem
                icon={<Bell className="w-4 h-4 text-blue-400" />}
                title="Spaced Repetition"
                desc="Smart concept scheduling for flashcards"
                checked={settings.spacedRepetition}
                onCheckedChange={() => handleToggle("spacedRepetition")}
              />
            </div>
          </div>

          {/* GOOGLE GEMINI API KEY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Google Gemini API Key</h3>
            </div>
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your key is used to execute Gemini 2.5 Flash models and embed documents into ChromaDB.
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Enter API Key..."
                  className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 font-mono text-xs h-10"
                />
                <Button onClick={handleSaveKey} className="h-10 bg-white text-black font-semibold text-xs px-4">
                  {savedKeySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ControlItem({
  icon,
  title,
  desc,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-zinc-900 dark:text-white">{title}</p>
          <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
