"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import axios from "axios";
import { 
  Bot, User, Mic, ArrowUp, Loader2, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, Sparkles, FileText, CheckCircle2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import SidebarLeft, { DocumentItem } from "@/components/dashboard/SidebarLeft";
import SidebarRight, { StudioType } from "@/components/dashboard/SidebarRight";
import CommandPalette from "@/components/dashboard/CommandPalette";
import LandingPage from "@/components/landing/LandingPage";
import { COMMANDS, Command } from "@/lib/commands";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const DEFAULT_KEY = process.env.NEXT_PUBLIC_GEMINI_KEY || "";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function RootPage() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  // --- CORE STATE ---
  const [apiKey, setApiKey] = useState(DEFAULT_KEY);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- APPLICATION SETTINGS ---
  const [appSettings, setAppSettings] = useState({
    focusMode: false,
    autoAudit: true,
    spacedRepetition: false,
  });

  // --- STUDIO STATES ---
  const [activeStudio, setActiveStudio] = useState<StudioType>("none");
  const [podcastScript, setPodcastScript] = useState<any[]>([]);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [debateTranscript, setDebateTranscript] = useState<any[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [vaultAudit, setVaultAudit] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // --- UI STATES ---
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [leftSidebarWide, setLeftSidebarWide] = useState(false);
  const [rightSidebarWide, setRightSidebarWide] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load persistence
  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem("notewave_gemini_key");
    if (savedKey) setApiKey(savedKey);

    const savedDocs = localStorage.getItem("notewave_docs");
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDocuments(parsed);
          setActiveDoc(parsed[0]);
          setHasEntered(true);
        }
      } catch (e) {
        console.error("Failed to load documents from storage", e);
      }
    }

    const savedSettings = localStorage.getItem("notewave_settings");
    if (savedSettings) {
      try {
        setAppSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // Sync settings
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("notewave_settings", JSON.stringify(appSettings));
    }
  }, [appSettings, mounted]);

  const updateApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("notewave_gemini_key", key);
  };

  // --- STUDIO API HANDLERS ---
  const handleGeneratePodcast = async () => {
    if (!activeDoc) return;
    setIsGeneratingPodcast(true);
    try {
      const res = await axios.post(`${API_BASE}/api/podcast`, {
        fileId: activeDoc.name,
        api_key: apiKey,
      });
      if (res.data?.script) setPodcastScript(res.data.script);
    } catch (err) {
      console.error("Podcast generation error:", err);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!activeDoc) return;
    setIsGeneratingFlashcards(true);
    try {
      const res = await axios.post(`${API_BASE}/api/flashcards`, {
        fileId: activeDoc.name,
        api_key: apiKey,
      });
      if (res.data?.flashcards) setFlashcards(res.data.flashcards);
    } catch (err) {
      console.error("Flashcards generation error:", err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateGraph = async () => {
    if (!activeDoc) return;
    setIsGeneratingGraph(true);
    try {
      const res = await axios.post(`${API_BASE}/api/graph`, {
        fileId: activeDoc.name,
        api_key: apiKey,
      });
      if (res.data?.nodes) setGraphData(res.data);
    } catch (err) {
      console.error("Graph extraction error:", err);
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  const handleStartDebate = async () => {
    if (!activeDoc) return;
    setIsDebating(true);
    try {
      const res = await axios.post(`${API_BASE}/api/debate`, {
        fileId: activeDoc.name,
        api_key: apiKey,
      });
      if (res.data?.transcript) setDebateTranscript(res.data.transcript);
    } catch (err) {
      console.error("Debate error:", err);
    } finally {
      setIsDebating(false);
    }
  };

  const handleVaultAudit = async () => {
    if (!activeDoc) return;
    setIsAuditing(true);
    try {
      const res = await axios.post(`${API_BASE}/api/vault`, {
        fileId: activeDoc.name,
        api_key: apiKey,
      });
      setVaultAudit(res.data);
    } catch (err) {
      console.error("Vault audit error:", err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGenerateQuiz = async (count: number = 5) => {
    if (!activeDoc) return;
    setIsGeneratingQuiz(true);
    try {
      const res = await axios.post(`${API_BASE}/api/quiz`, {
        fileId: activeDoc.name,
        count,
        api_key: apiKey,
      });
      if (res.data?.questions) setQuizQuestions(res.data.questions);
    } catch (err) {
      console.error("Quiz generation error:", err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeDoc) return;
    setIsGeneratingSummary(true);
    try {
      const res = await axios.post(`${API_BASE}/api/summary`, {
        fileId: activeDoc.name,
        api_key: apiKey,
      });
      if (res.data?.summary) setSummaryText(res.data.summary);
    } catch (err) {
      console.error("Summary error:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // --- UPLOAD HANDLER ---
  const processUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);

    try {
      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newDoc: DocumentItem = {
        id: Date.now(),
        name: res.data.filename,
        filename: res.data.filename,
        date: "Just now",
        chunks: res.data.chunks || 1,
        mastery: 85,
      };

      const updatedDocs = [newDoc, ...documents.filter((d) => d.name !== newDoc.name)];
      setDocuments(updatedDocs);
      setActiveDoc(newDoc);
      localStorage.setItem("notewave_docs", JSON.stringify(updatedDocs));

      // Pre-fill generated items if present
      if (res.data.flashcards) setFlashcards(res.data.flashcards);
      if (res.data.graph?.nodes?.length > 0) setGraphData(res.data.graph);
      if (res.data.summary) setSummaryText(res.data.summary);

      // Welcome message
      setMessages([
        {
          role: "assistant",
          content: `**${file.name}** is indexed and ready! Ask questions, or type \`/\` to launch any intelligence studio.`,
        },
      ]);

      setHasEntered(true);
      setIsUploadOpen(false);

      if (appSettings.autoAudit) {
        handleVaultAudit();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err.response?.data?.detail || "Document upload failed. Ensure backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- SWITCH / DELETE DOCUMENT ---
  const handleSwitchFile = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setMessages([
      {
        role: "assistant",
        content: `Switched context to **${doc.name}**. Ready for research questions.`,
      },
    ]);
    setActiveStudio("none");
    setPodcastScript([]);
    setFlashcards([]);
    setGraphData({ nodes: [], links: [] });
    setDebateTranscript([]);
    setVaultAudit(null);
    setQuizQuestions([]);
    setSummaryText("");
  };

  const handleDeleteFile = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/api/documents/${doc.name}`).catch(() => {});
    } catch (err) {
      console.error(err);
    }
    const updated = documents.filter((d) => d.id !== doc.id);
    setDocuments(updated);
    localStorage.setItem("notewave_docs", JSON.stringify(updated));
    if (activeDoc?.id === doc.id) {
      setActiveDoc(updated.length > 0 ? updated[0] : null);
      setMessages([]);
    }
  };

  // --- COMMAND PALETTE ---
  const executeCommand = (cmd: Command) => {
    setFilteredCommands([]);
    setInput("");
    setShowRightSidebar(true);

    if (cmd.id === "podcast") {
      setActiveStudio("podcast");
      if (podcastScript.length === 0) handleGeneratePodcast();
    } else if (cmd.id === "flashcards") {
      setActiveStudio("flashcards");
      if (flashcards.length === 0) handleGenerateFlashcards();
    } else if (cmd.id === "graph") {
      setActiveStudio("graph");
      if (!graphData?.nodes?.length) handleGenerateGraph();
    } else if (cmd.id === "debate") {
      setActiveStudio("debate");
      if (debateTranscript.length === 0) handleStartDebate();
    } else if (cmd.id === "vault") {
      setActiveStudio("vault");
      if (!vaultAudit) handleVaultAudit();
    } else if (cmd.id === "quiz") {
      setActiveStudio("quiz");
      if (quizQuestions.length === 0) handleGenerateQuiz();
    } else if (cmd.id === "summary") {
      setActiveStudio("summary");
      if (!summaryText) handleGenerateSummary();
    } else if (cmd.id === "voice") {
      setActiveStudio("voice");
    } else if (cmd.id === "settings") {
      setActiveStudio("settings");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.startsWith("/")) {
      const query = val.slice(1).toLowerCase();
      setFilteredCommands(
        COMMANDS.filter((c) => c.id.includes(query) || c.label.includes(query))
      );
      setSelectedCommandIndex(0);
    } else {
      setFilteredCommands([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeCommand(filteredCommands[selectedCommandIndex]);
      } else if (e.key === "Escape") {
        setFilteredCommands([]);
      }
    }
  };

  // --- SEND CHAT MESSAGE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || !activeDoc) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        messages: newMessages,
        fileId: activeDoc.name,
        api_key: apiKey,
      });

      const reply = res.data?.content || res.data?.text || "Answer synthesized.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `⚠️ Error communicating with Gemini backend: ${err.response?.data?.detail || err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  // Render Landing Page if user has no documents or chooses to land
  if (!hasEntered) {
    return (
      <LandingPage
        onEnter={() => setHasEntered(true)}
        onUploadFile={processUpload}
        isUploading={isUploading}
        apiKey={apiKey}
        onUpdateApiKey={updateApiKey}
      />
    );
  }

  return (
    <div
      className={`h-screen flex bg-white dark:bg-black overflow-hidden font-sans transition-all duration-700 ${
        appSettings.focusMode ? "grayscale-[0.8] brightness-90" : ""
      }`}
    >
      {/* LEFT SIDEBAR: SOURCES & LIBRARY */}
      <SidebarLeft
        documents={documents}
        activeDoc={activeDoc}
        isUploading={isUploading}
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
        handleUploadForm={processUpload}
        handleSwitchFile={handleSwitchFile}
        handleDeleteFile={handleDeleteFile}
        setTheme={setTheme}
        theme={theme}
        showLeftSidebar={showLeftSidebar}
        isWide={leftSidebarWide}
        toggleSidebar={() => setShowLeftSidebar(!showLeftSidebar)}
        onOpenSettings={() => {
          setActiveStudio("settings");
          setShowRightSidebar(true);
        }}
      />

      {/* CENTER STAGE: COPILOT CHAT */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative overflow-hidden transition-all duration-300 min-w-0">
        {/* HEADER BAR */}
        <header className="h-16 flex-none flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 z-30">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="h-8 w-8 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${!showLeftSidebar ? "rotate-180" : ""}`} />
            </Button>
            {showLeftSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftSidebarWide(!leftSidebarWide)}
                className="h-8 w-8 text-zinc-400 hover:text-white"
              >
                {leftSidebarWide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            {!showLeftSidebar && (
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white ml-1">
                NoteWave
              </span>
            )}
          </div>

          {/* ACTIVE CONTEXT PILL */}
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Context</span>
            <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-xs font-semibold truncate max-w-[200px] text-zinc-800 dark:text-zinc-200">
              {activeDoc?.name || "No Document Active"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {showRightSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightSidebarWide(!rightSidebarWide)}
                className="h-8 w-8 text-zinc-400 hover:text-white"
              >
                {rightSidebarWide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="h-8 w-8 text-zinc-400 hover:text-white"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showRightSidebar ? "" : "rotate-180"}`} />
            </Button>
          </div>
        </header>

        {/* CHAT SCROLL AREA */}
        <div className={`flex-1 overflow-hidden relative ${appSettings.focusMode ? "opacity-75" : "opacity-100"}`}>
          <ScrollArea className="h-full w-full">
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-40">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">AI Research Copilot</p>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      Ask anything about your document or type <code className="font-mono text-purple-400">/</code> to launch specialized studios.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={i}
                      className={`flex gap-4 animate-in fade-in duration-300 ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <Avatar className={`h-8 w-8 mt-1 shrink-0 ${isUser ? "bg-zinc-800" : "bg-zinc-900 dark:bg-white"}`}>
                        <AvatarFallback className="text-xs">
                          {isUser ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-black dark:text-black" />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
                        <div
                          className={`inline-block text-left ${
                            isUser
                              ? "bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 rounded-2xl text-zinc-900 dark:text-zinc-100 text-sm shadow-sm"
                              : "markdown-content w-full"
                          }`}
                        >
                          {isUser ? (
                            <p>{m.content}</p>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Synthesizing answer with Gemini...</span>
                </div>
              )}
              <div ref={messagesEndRef} className="h-10" />
            </div>
          </ScrollArea>
        </div>

        {/* BOTTOM INPUT BAR WITH COMMAND PALETTE */}
        <footer className="flex-none p-6 pt-2">
          <div className="max-w-3xl mx-auto relative">
            <CommandPalette
              commands={filteredCommands}
              selectedIndex={selectedCommandIndex}
              onSelect={executeCommand}
            />

            <form onSubmit={handleSubmit} className="relative group">
              <Input
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about document or type / for studios..."
                className="h-14 pl-12 pr-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl text-zinc-900 dark:text-zinc-100 text-sm focus-visible:ring-1 focus-visible:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => {
                  setActiveStudio("voice");
                  setShowRightSidebar(true);
                }}
                className="absolute left-4 top-4 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="absolute right-2.5 top-2.5 h-9 w-9 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </footer>
      </div>

      {/* RIGHT SIDEBAR: INTELLIGENCE STUDIOS */}
      <SidebarRight
        activeStudio={activeStudio}
        showRightSidebar={showRightSidebar}
        isWide={rightSidebarWide}
        onSelectStudio={(studio) => {
          setActiveStudio(studio);
          setShowRightSidebar(true);
          if (studio === "podcast" && podcastScript.length === 0) handleGeneratePodcast();
          if (studio === "flashcards" && flashcards.length === 0) handleGenerateFlashcards();
          if (studio === "graph" && !graphData?.nodes?.length) handleGenerateGraph();
          if (studio === "debate" && debateTranscript.length === 0) handleStartDebate();
          if (studio === "vault" && !vaultAudit) handleVaultAudit();
          if (studio === "quiz" && quizQuestions.length === 0) handleGenerateQuiz();
          if (studio === "summary" && !summaryText) handleGenerateSummary();
        }}
        podcastProps={{
          script: podcastScript,
          isLoading: isGeneratingPodcast,
          onGenerate: handleGeneratePodcast,
          onClose: () => setActiveStudio("none"),
        }}
        flashcardProps={{
          cards: flashcards,
          isLoading: isGeneratingFlashcards,
          onGenerate: handleGenerateFlashcards,
          onClose: () => setActiveStudio("none"),
          onAddCard: (newCard: any) => setFlashcards([...flashcards, newCard]),
        }}
        graphProps={{
          data: graphData,
          isLoading: isGeneratingGraph,
          onGenerate: handleGenerateGraph,
          onClose: () => setActiveStudio("none"),
        }}
        debateProps={{
          transcript: debateTranscript,
          isLoading: isDebating,
          onRestart: handleStartDebate,
          onClose: () => setActiveStudio("none"),
        }}
        vaultProps={{
          audit: vaultAudit,
          isLoading: isAuditing,
          onAudit: handleVaultAudit,
          onClose: () => setActiveStudio("none"),
        }}
        quizProps={{
          questions: quizQuestions,
          isLoading: isGeneratingQuiz,
          onGenerate: handleGenerateQuiz,
          onClose: () => setActiveStudio("none"),
        }}
        summaryProps={{
          summary: summaryText,
          isLoading: isGeneratingSummary,
          onGenerate: handleGenerateSummary,
          onClose: () => setActiveStudio("none"),
        }}
        voiceProps={{
          onTranscription: (text: string) => {
            setInput(text);
          },
          onClose: () => setActiveStudio("none"),
        }}
        settingsProps={{
          settings: appSettings,
          apiKey: apiKey,
          onUpdateSettings: (newSettings: any) => setAppSettings(newSettings),
          onUpdateApiKey: updateApiKey,
          onClose: () => setActiveStudio("none"),
        }}
      />
    </div>
  );
}
