"use client";

import React from "react";
import { 
  FileText, Plus, Trash2, Moon, Sun, Loader2, 
  Zap, Settings2, Database, ChevronLeft, UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface DocumentItem {
  id: number | string;
  name: string;
  filename?: string;
  date?: string;
  chunks?: number;
  mastery?: number;
}

interface SidebarLeftProps {
  documents: DocumentItem[];
  activeDoc: DocumentItem | null;
  isUploading: boolean;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  handleUploadForm: (file: File) => void;
  handleSwitchFile: (doc: DocumentItem) => void;
  handleDeleteFile: (e: React.MouseEvent, doc: DocumentItem) => void;
  setTheme: (theme: string) => void;
  theme: string | undefined;
  showLeftSidebar: boolean;
  isWide: boolean;
  toggleSidebar: () => void;
  onOpenSettings: () => void;
}

export default function SidebarLeft({
  documents,
  activeDoc,
  isUploading,
  isUploadOpen,
  setIsUploadOpen,
  handleUploadForm,
  handleSwitchFile,
  handleDeleteFile,
  setTheme,
  theme,
  showLeftSidebar,
  isWide,
  onOpenSettings,
}: SidebarLeftProps) {
  const widthClass = !showLeftSidebar ? "w-0 border-r-0" : isWide ? "w-[380px]" : "w-[280px]";

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadForm(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "relative h-full bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out z-40 shrink-0",
        widthClass
      )}
    >
      <div
        className={cn(
          "flex flex-col h-full overflow-hidden transition-opacity duration-300",
          !showLeftSidebar ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible"
        )}
      >
        {/* BRAND HEADER */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white dark:text-black fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">NoteWave</span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">Research Copilot</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 icon-btn"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* NEW SOURCE BUTTON */}
        <div className="p-4 shrink-0">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 shadow-md rounded-xl h-11 px-4 font-bold text-xs">
                <Plus className="w-4 h-4" />
                <span className="uppercase tracking-wider">New Source</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-zinc-950 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle>Add Document Source</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-3">
                <p className="text-xs text-zinc-400">
                  Upload a PDF document to parse with Gemini and index vectors into ChromaDB.
                </p>
                <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 text-center cursor-pointer hover:border-zinc-600 transition-colors relative">
                  <UploadCloud className="w-8 h-8 text-zinc-400" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">Select PDF File</p>
                    <p className="text-[10px] text-zinc-500">Up to 25MB supported</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={onFileInputChange}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {isUploading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Chunking and indexing document...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* SOURCE LIBRARY */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Library</h3>
              <span className="text-[10px] text-zinc-500 font-mono">{documents.length} docs</span>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs italic">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => {
                const isActive = activeDoc?.name === doc.name;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSwitchFile(doc)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          isActive ? "bg-purple-400" : "bg-zinc-600"
                        )}
                      />
                      <span className="truncate max-w-[170px]">{doc.name}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 text-zinc-500 hover:text-red-400"
                      onClick={(e) => handleDeleteFile(e, doc)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* BOTTOM FOOTER */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between px-1">
            <div
              onClick={onOpenSettings}
              className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-zinc-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-zinc-900 dark:text-white">App Preferences</span>
                <span className="text-[9px] text-zinc-500 uppercase">Profile & Logic</span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-30 text-zinc-400">
              <Database className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase">Chroma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
