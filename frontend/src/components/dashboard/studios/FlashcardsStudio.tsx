"use client";

import React, { useState } from "react";
import { 
  LayoutList, RefreshCw, ChevronLeft, ChevronRight, 
  RotateCcw, BrainCircuit, Loader2, X, Plus, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardsStudioProps {
  cards: Flashcard[];
  isLoading: boolean;
  onGenerate: () => void;
  onClose: () => void;
  onAddCard: (card: Flashcard) => void;
}

export default function FlashcardsStudio({
  cards = [],
  isLoading,
  onGenerate,
  onClose,
  onAddCard,
}: FlashcardsStudioProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  const nextCard = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 100);
  };

  const prevCard = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 100);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) return;
    onAddCard({ question: newQ.trim(), answer: newA.trim() });
    setNewQ("");
    setNewA("");
    setIsAddOpen(false);
    setTimeout(() => setCurrentIndex(cards.length), 100);
  };

  const toggleMastered = (idx: number) => {
    if (masteredIds.includes(idx)) {
      setMasteredIds(masteredIds.filter((i) => i !== idx));
    } else {
      setMasteredIds([...masteredIds, idx]);
      nextCard();
    }
  };

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <LayoutList className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Flashcard Studio</h2>
            <p className="text-[10px] text-zinc-400">3D Active Recall</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 icon-btn">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-zinc-950 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle>Create Custom Flashcard</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveCard} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Question</label>
                  <Input 
                    value={newQ} 
                    onChange={(e) => setNewQ(e.target.value)} 
                    placeholder="Key concept question..."
                    className="dark:bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Answer</label>
                  <Textarea 
                    value={newA} 
                    onChange={(e) => setNewA(e.target.value)} 
                    placeholder="Accurate definition or explanation..."
                    className="dark:bg-zinc-900 border-zinc-800"
                  />
                </div>
                <Button type="submit" className="w-full bg-white text-black font-semibold">Save Card</Button>
              </form>
            </DialogContent>
          </Dialog>

          {cards.length > 0 && (
            <Button variant="ghost" size="icon" onClick={onGenerate} disabled={isLoading} className="h-8 w-8 icon-btn">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 icon-btn">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Extracting Conceptual Cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 text-zinc-400">
            <LayoutList className="w-12 h-12 opacity-20" />
            <p className="text-xs max-w-xs">Extract core study definitions with interactive 3D cards.</p>
            <div className="flex gap-2">
              <Button onClick={onGenerate} className="rounded-full px-6 bg-white text-black font-semibold text-xs">
                Generate Flashcards
              </Button>
              <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-full px-6 text-xs icon-btn">
                Add Manual
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* PROGRESS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span>{masteredIds.length} Mastered</span>
              </div>
              <Progress value={progress} className="h-1 bg-zinc-800" />
            </div>

            {/* 3D FLIP CARD */}
            <div className="flex-1 min-h-[300px] perspective-1000">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full h-full duration-500 preserve-3d transition-transform cursor-pointer rounded-2xl ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-between text-center shadow-xl">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-zinc-400 border-zinc-700">
                    Question
                  </Badge>
                  <p className="text-base md:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {currentCard?.question}
                  </p>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Click to flip
                  </span>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 p-8 rounded-2xl border border-purple-500/30 bg-zinc-900 text-white flex flex-col items-center justify-between text-center shadow-2xl">
                  <Badge className="bg-purple-600/30 text-purple-300 text-[9px] uppercase tracking-wider">
                    Answer
                  </Badge>
                  <div className="overflow-y-auto max-h-[180px] w-full px-2">
                    <p className="text-sm md:text-base font-normal leading-relaxed text-zinc-200">
                      {currentCard?.answer}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    Click to return
                  </span>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevCard}
                className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 icon-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex gap-2 flex-1 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMastered(currentIndex)}
                  className={`rounded-full text-xs gap-1.5 ${
                    masteredIds.includes(currentIndex)
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                      : "border-zinc-200 dark:border-zinc-800 icon-btn"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {masteredIds.includes(currentIndex) ? "Mastered" : "Mark Mastered"}
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextCard}
                className="h-10 w-10 rounded-full border-zinc-200 dark:border-zinc-800 icon-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
