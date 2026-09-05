"use client";

import React, { useState } from "react";
import { 
  BrainCircuit, HelpCircle, Trophy, RefreshCw, ChevronRight, 
  CheckCircle2, XCircle, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  concept?: string;
  difficulty?: number;
}

interface QuizStudioProps {
  questions: QuizQuestion[];
  isLoading: boolean;
  onGenerate: (count: number) => void;
  onClose: () => void;
}

export default function QuizStudio({
  questions = [],
  isLoading,
  onGenerate,
  onClose,
}: QuizStudioProps) {
  const [stage, setStage] = useState<"setup" | "playing" | "report">("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [qCount, setQCount] = useState(5);

  const handleStart = () => {
    onGenerate(qCount);
    setStage("playing");
    setCurrentIndex(0);
    setUserAnswers({});
  };

  const handleSelect = (option: string) => {
    if (userAnswers[currentIndex] !== undefined) return; // Answer locked for this question
    setUserAnswers({ ...userAnswers, [currentIndex]: option });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStage("report");
    }
  };

  const currentQ = questions[currentIndex];
  const selectedAnswer = userAnswers[currentIndex];
  const isAnswered = selectedAnswer !== undefined;
  const correctCount = questions.filter((q, i) => userAnswers[i] === q.answer).length;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Quiz Studio</h2>
            <p className="text-[10px] text-zinc-400">Adaptive Knowledge Testing</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {stage === "report" && (
            <Button variant="ghost" size="icon" onClick={() => setStage("setup")} className="h-8 w-8 text-zinc-400 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Synthesizing Cognitive Assessment...
                </p>
              </div>
            ) : stage === "setup" || questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-8">
                <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <HelpCircle className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Knowledge Mastery Check</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-[240px]">
                    Evaluate your retention with adaptive multiple-choice questions.
                  </p>
                </div>
                <div className="flex gap-2">
                  {[5, 10].map((n) => (
                    <Button
                      key={n}
                      variant={qCount === n ? "default" : "outline"}
                      onClick={() => setQCount(n)}
                      className={`rounded-full h-8 px-4 text-xs font-bold ${
                        qCount === n ? "bg-white text-black" : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {n} Questions
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleStart}
                  className="w-full rounded-xl h-12 bg-white text-black hover:bg-zinc-200 font-bold text-sm"
                >
                  Start Assessment
                </Button>
              </div>
            ) : stage === "playing" && currentQ ? (
              <div className="space-y-6">
                {/* PROGRESS */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                  </div>
                  <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1 bg-zinc-800" />
                </div>

                {/* QUESTION CARD */}
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-4">
                  {currentQ.concept && (
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-cyan-400 border-cyan-500/30">
                      {currentQ.concept} • Difficulty {currentQ.difficulty || 5}/10
                    </Badge>
                  )}
                  <h3 className="text-base font-semibold leading-relaxed text-zinc-900 dark:text-white">
                    {currentQ.question}
                  </h3>

                  <div className="space-y-2.5 pt-2">
                    {currentQ.options.map((opt, i) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrect = isAnswered && opt === currentQ.answer;
                      const isWrongSelected = isAnswered && isSelected && !isCorrect;

                      return (
                        <button
                          key={i}
                          disabled={isAnswered}
                          onClick={() => handleSelect(opt)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            isCorrect
                              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                              : isWrongSelected
                              ? "bg-rose-500/15 border-rose-500/50 text-rose-300"
                              : isSelected
                              ? "bg-zinc-800 border-zinc-700 text-white"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                          {isWrongSelected && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-1 animate-in fade-in">
                      <p className="font-bold text-[10px] uppercase text-zinc-400">Explanation</p>
                      <p>{currentQ.explanation || (selectedAnswer === currentQ.answer ? "Correct answer!" : `Correct answer: ${currentQ.answer}`)}</p>
                    </div>
                  )}
                </div>

                {isAnswered && (
                  <Button
                    onClick={nextQuestion}
                    className="w-full rounded-xl h-11 bg-white text-black font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>{currentIndex < questions.length - 1 ? "Next Question" : "View Results"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              /* REPORT */
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                <div className="h-16 w-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white">{scorePercent}% Score</h2>
                  <p className="text-xs text-zinc-400">
                    You answered {correctCount} of {questions.length} questions correctly.
                  </p>
                </div>
                <Badge className={scorePercent >= 80 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400"}>
                  {scorePercent >= 80 ? "Mastery Achieved" : scorePercent >= 60 ? "Proficient" : "Review Recommended"}
                </Badge>
                <div className="flex gap-3 w-full pt-4">
                  <Button
                    onClick={handleStart}
                    className="flex-1 rounded-xl bg-white text-black font-semibold text-xs h-11"
                  >
                    Retake Quiz
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStage("setup")}
                    className="flex-1 rounded-xl border-zinc-800 text-zinc-400 text-xs h-11"
                  >
                    Configure
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
