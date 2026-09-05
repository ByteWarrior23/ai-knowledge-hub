"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Loader2, Zap, ZoomIn, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const ForceGraph3D = dynamic(
  () => import("react-force-graph-3d").then((mod) => mod.ForceGraph3D || mod.default),
  { ssr: false }
);

interface GraphStudioProps {
  data: any;
  isLoading: boolean;
  onGenerate: () => void;
  onClose: () => void;
}

export default function GraphStudio({ data, isLoading, onGenerate, onClose }: GraphStudioProps) {
  const fgRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleZoom = () => {
    if (fgRef.current) fgRef.current.zoomToFit(500, 80);
  };

  const hasData = mounted && data?.nodes && Array.isArray(data.nodes) && data.nodes.length > 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-white">Knowledge Graph</h2>
            <p className="text-[10px] text-zinc-400">3D Neural Concept Matrix</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasData && (
            <Button variant="ghost" size="icon" onClick={onGenerate} disabled={isLoading} className="h-8 w-8 text-zinc-400 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* GRAPH CANVAS */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950">
        {isLoading || !mounted ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Synthesizing 3D Nodes...</p>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-4">
            <Zap className="w-12 h-12 opacity-20" />
            <p className="text-xs">No graph extracted yet. Click to construct 3D concept links.</p>
            <Button onClick={onGenerate} className="rounded-full px-6 bg-white text-black font-semibold text-xs">
              Generate Graph
            </Button>
          </div>
        ) : (
          <>
            <ForceGraph3D
              ref={fgRef}
              graphData={data}
              nodeLabel="name"
              nodeAutoColorBy="group"
              onNodeClick={(node: any) => setSelectedNode(node)}
              backgroundColor="#000000"
              nodeRelSize={7}
              linkWidth={1.5}
              linkOpacity={0.35}
              showNavInfo={false}
            />

            {/* HUD OVERLAY */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <Card className="p-3 bg-black/80 backdrop-blur-md border-zinc-800 text-zinc-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Concept Map</span>
                </div>
                <p className="text-xs font-semibold">{data.nodes.length} Nodes • {data.links.length} Relations</p>
                {selectedNode && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-yellow-300">
                    Active: {selectedNode.name}
                  </div>
                )}
              </Card>
            </div>

            {/* ZOOM CONTROL */}
            <div className="absolute bottom-6 right-6 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoom}
                className="rounded-full bg-zinc-900/90 border-zinc-800 h-10 w-10 text-zinc-200 hover:text-white shadow-xl backdrop-blur-md"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
