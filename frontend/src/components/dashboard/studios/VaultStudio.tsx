"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, BarChart3, Fingerprint, X, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface VaultAudit {
  truthScore: number;
  biasScore: number;
  provenance?: string;
  unsupportedClaims?: string[];
}

interface VaultStudioProps {
  audit: VaultAudit | null;
  isLoading: boolean;
  onAudit: () => void;
  onClose: () => void;
}

export default function VaultStudio({ audit, isLoading, onAudit, onClose }: VaultStudioProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Verified Vault</h2>
            <p className="text-[10px] text-zinc-400">Integrity & Bias Auditor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {audit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAudit}
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

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Auditing Document Integrity...</p>
          </div>
        ) : !audit ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-zinc-400">
            <ShieldCheck className="w-12 h-12 opacity-20" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-200">Vault Secure</h3>
              <p className="text-xs max-w-xs text-zinc-500">Scan document for factual verification, logical fallacies, and bias scoring.</p>
            </div>
            <Button onClick={onAudit} className="rounded-full px-6 bg-white text-black font-semibold text-xs">
              Perform Integrity Audit
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TRUTH SCORE */}
            <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Truth Score</p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white">{audit.truthScore}%</p>
                </div>
                <Badge
                  variant={audit.truthScore >= 80 ? "default" : "destructive"}
                  className={audit.truthScore >= 80 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : ""}
                >
                  {audit.truthScore >= 80 ? "High Integrity" : "Requires Review"}
                </Badge>
              </div>
              <Progress value={audit.truthScore} className="h-1.5 bg-zinc-800" />
            </Card>

            {/* METRICS GRID */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Bias Index</span>
                </div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">{audit.biasScore}%</p>
                <p className="text-[9px] text-zinc-500 font-mono">
                  {audit.biasScore < 20 ? "Low Latent Bias" : "Moderate Framing"}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Provenance</span>
                </div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">Verified</p>
                <p className="text-[9px] text-zinc-500 font-mono truncate">{audit.provenance || "SHA-256 Vector Index"}</p>
              </div>
            </div>

            {/* UNSUPPORTED CLAIMS */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Audited Claims & Notes
              </h3>
              {(audit.unsupportedClaims || []).length === 0 ? (
                <p className="text-xs text-emerald-400">Zero unverified or anomalous claims detected.</p>
              ) : (
                audit.unsupportedClaims!.map((claim, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed text-zinc-300"
                  >
                    {claim}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
