"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Loader2, Zap, ZoomIn, X, RefreshCw, Box, Network } from "lucide-react";
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

const GROUP_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];

function resolveNodePos(links: any[], nodes: any[]) {
  const n = nodes.length;
  const rad = 150;
  const cx = 300;
  const cy = 220;
  const pos = new Map<string, { x: number; y: number }>();
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / (n || 1) - Math.PI / 2;
    pos.set(node.id ?? node.name ?? `n${i}`, {
      x: cx + rad * 1.35 * Math.cos(angle),
      y: cy + rad * Math.sin(angle),
    });
  });
  const nodeRef = (ref: any, i: number) => pos.get(ref ?? "") ?? { x: cx, y: cy };
  return { pos, nodeRef };
}

function ConceptMap2D({ data }: { data: any }) {
  const nodes = data?.nodes || [];
  const links = data?.links || [];
  if (!nodes.length) return null;

  const { pos, nodeRef } = resolveNodePos(links, nodes);
  const radius = (v?: number) => 7 + (v || 8) / 3;

  return (
    <svg className="w-full h-full" viewBox="0 0 600 440" preserveAspectRatio="xMidYMid meet">
      <defs>
        {nodes.map((nd: any, i: number) => (
          <radialGradient key={nd.id ?? nd.name ?? `n${i}`} id={`g${i}`}>
            <stop offset="0%" stopColor={GROUP_COLORS[(nd.group || 1) - 1] || "#a1a1aa"} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#3f3f46" stopOpacity="0.85" />
          </radialGradient>
        ))}
      </defs>
      {links.map((l: any, li: number) => {
        const sx = pos.get(l.source ?? "") ?? { x: 300, y: 220 };
        const tx = pos.get(l.target ?? "") ?? { x: 300, y: 220 };
        return (
          <g key={`l${li}`}>
            <line
              x1={sx.x}
              y1={sx.y}
              x2={tx.x}
              y2={tx.y}
              stroke="#71717a"
              strokeWidth={1.4}
              strokeOpacity={0.65}
            />
            {l.label && (
              <text
                x={(sx.x + tx.x) / 2}
                y={(sx.y + tx.y) / 2}
                fill="#a1a1aa"
                fontSize={9}
                textAnchor="middle"
                dy={-4}
              >
                {l.label}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((nd: any, i: number) => {
        const p = nodeRef(nd.id ?? nd.name ?? `n${i}`, i);
        return (
          <g key={nd.id ?? nd.name ?? `n${i}`}>
            <circle cx={p.x} cy={p.y} r={radius(nd.val)} fill={`url(#g${i})`} stroke="#18181b" strokeWidth={1.5}>
              <title>{nd.name}</title>
            </circle>
            <text
              x={p.x}
              y={p.y + radius(nd.val) + 11}
              fill="#e4e4e7"
              fontSize={9.5}
              textAnchor="middle"
              fontWeight={600}
            >
              {nd.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

class GraphErrorBoundary extends React.Component<
  { onFallback: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("3D Graph render failed, falling back to 2D map:", error);
    this.props.onFallback();
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export default function GraphStudio({ data, isLoading, onGenerate, onClose }: GraphStudioProps) {
  const fgRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [mode, setMode] = useState<"3d" | "2d">("3d");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && !window.WebGLRenderingContext) setMode("2d");
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
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMode((m) => (m === "3d" ? "2d" : "3d"))}
                title={mode === "3d" ? "Switch to 2D map" : "Switch to 3D graph"}
                className="h-8 w-8 icon-btn"
              >
                {mode === "3d" ? <Network className="w-3.5 h-3.5" /> : <Box className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onGenerate} disabled={isLoading} className="h-8 w-8 icon-btn">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 icon-btn">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* GRAPH CANVAS */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950 min-h-0">
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
          <div className="absolute inset-0 min-h-[340px]">
            {mode === "2d" ? (
              <ConceptMap2D data={data} />
            ) : (
              <GraphErrorBoundary onFallback={() => setMode("2d")}>
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
              </GraphErrorBoundary>
            )}

            {/* HUD OVERLAY */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <Card className="p-3 bg-black/80 backdrop-blur-md border-zinc-800 text-zinc-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Concept Map</span>
                </div>
                <p className="text-xs font-semibold">{data.nodes.length} Nodes • {data.links.length} Relations</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">{mode === "3d" ? "3D view" : "2D view"}</p>
                {selectedNode && (
                  <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-yellow-300">
                    Active: {selectedNode.name}
                  </div>
                )}
              </Card>
            </div>

            {/* ZOOM CONTROL (3D only) */}
            {mode === "3d" && (
              <div className="absolute bottom-6 right-6 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoom}
                  className="rounded-full bg-zinc-900/90 border-zinc-800 h-10 w-10 text-zinc-200 dark:hover:text-white hover:text-zinc-100 shadow-xl backdrop-blur-md"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}