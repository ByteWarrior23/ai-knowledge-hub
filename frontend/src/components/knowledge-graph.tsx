"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ZoomIn } from "lucide-react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";

const ForceGraph3D = dynamic(
  () =>
    import("react-force-graph-3d").then((mod) => mod.ForceGraph3D || mod.default),
  { ssr: false }
);

export interface GraphNode {
  id: string;
  name: string;
  val: number;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function KnowledgeGraph({ data }: { data: GraphData }) {
  const fgRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasData =
    mounted && data && Array.isArray(data.nodes) && data.nodes.length > 0;

  const zoomToFit = () => {
    if (fgRef.current) fgRef.current.zoomToFit(600, 100);
  };

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-2xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">
          No knowledge graph available for this document.
        </p>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden h-[600px] bg-black border-border">
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeAutoColorBy="group"
        backgroundColor="#000000"
        nodeRelSize={6}
        linkWidth={1.5}
        linkOpacity={0.4}
        showNavInfo={false}
      />
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={zoomToFit}
          className="rounded-full bg-background/80 backdrop-blur-md h-10 w-10 shadow-xl border-border"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}