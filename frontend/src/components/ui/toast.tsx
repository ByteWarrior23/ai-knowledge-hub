"use client";

import React, { useEffect } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";

export type ToastType = "error" | "success" | "info";

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-purple-500 shrink-0" />,
  };

  const borders = {
    error: "border-red-200 dark:border-red-900/50",
    success: "border-emerald-200 dark:border-emerald-900/50",
    info: "border-purple-200 dark:border-purple-900/50",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 animate-in slide-in-from-right-5 ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="text-sm flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="icon-btn shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
