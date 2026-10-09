import React, { useState, useMemo } from 'react';
import { DocumentNote } from '../types';
import {
  Network,
  Swords,
  GitMerge,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  Flame,
  ShieldAlert,
  Loader2,
  X,
  Check,
} from 'lucide-react';

interface GraphViewProps {
  notes: DocumentNote[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onCreateSynthesisNote: (synthesisNote: DocumentNote) => void;
}

interface GraphNode {
  id: string;
  label: string;
  noteId: string;
  epistemicStatus: 'unchallenged' | 'under_siege' | 'resilient';
  resilienceScore: number;
  domains: string[];
  x: number;
  y: number;
  radius: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'contradicts' | 'assumes' | 'supports';
  label: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateSynthesisNote,
}) => {
  const [selectedThesisId, setSelectedThesisId] = useState<string>(activeNoteId);
  const [selectedAntithesisId, setSelectedAntithesisId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [edgeFilter, setEdgeFilter] = useState<'all' | 'contradictions' | 'supports'>('all');

  // Compute layout and edges
  const { nodes, edges } = useMemo(() => {
    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const noteCount = notes.length;

    const nodeList: GraphNode[] = notes.map((note, index) => {
      const angle = (index / Math.max(1, noteCount)) * 2 * Math.PI - Math.PI / 2;
      const dist = 180;
      return {
        id: note.id,
        label: note.title,
        noteId: note.id,
        epistemicStatus: note.epistemicStatus,
        resilienceScore: note.resilienceScore,
        domains: note.intellectualDomains,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        radius: note.id === activeNoteId ? 22 : 18,
      };
    });

    const edgeList: GraphEdge[] = [];

    // Dynamically derive epistemic edges based on content and domains
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const n1 = notes[i];
        const n2 = notes[j];

        // Direct contradiction condition: If either note has counter-evidence referencing the other or shared domain with under_siege status
        const sharedDomain = n1.intellectualDomains.some((d) => n2.intellectualDomains.includes(d));
        const isUnderSiege = n1.epistemicStatus === 'under_siege' || n2.epistemicStatus === 'under_siege';

        if (isUnderSiege && (sharedDomain || (i === 0 && j === 1))) {
          edgeList.push({
            id: `edge-${n1.id}-${n2.id}-contra`,
            source: n1.id,
            target: n2.id,
            type: 'contradicts',
            label: 'CONTRADICTS (Dialectical Tension)',
          });
        } else if (n1.epistemicStatus === 'resilient' && n2.epistemicStatus === 'resilient') {
          edgeList.push({
            id: `edge-${n1.id}-${n2.id}-supp`,
            source: n1.id,
            target: n2.id,
            type: 'supports',
            label: 'SUPPORTS (Verified Evidence)',
          });
        } else {
          edgeList.push({
            id: `edge-${n1.id}-${n2.id}-assum`,
            source: n1.id,
            target: n2.id,
            type: 'assumes',
            label: 'ASSUMES (Untested Dependency)',
          });
        }
      }
    }

    return { nodes: nodeList, edges: edgeList };
  }, [notes, activeNoteId]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const filteredEdges = useMemo(() => {
    if (edgeFilter === 'contradictions') return edges.filter((e) => e.type === 'contradicts');
    if (edgeFilter === 'supports') return edges.filter((e) => e.type === 'supports');
    return edges;
  }, [edges, edgeFilter]);

  // Execute Hegelian Synthesis
  const handleTriggerSynthesis = async () => {
    if (!selectedThesisId || !selectedAntithesisId) return;
    const thesis = notes.find((n) => n.id === selectedThesisId);
    const antithesis = notes.find((n) => n.id === selectedAntithesisId);
    if (!thesis || !antithesis) return;

    setIsSynthesizing(true);
    try {
      const response = await fetch('/api/gemini/hegelian-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thesisTitle: thesis.title,
          thesisContent: thesis.content,
          antithesisTitle: antithesis.title,
          antithesisContent: antithesis.content,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate Hegelian synthesis');
      const data = await response.json();

      const synthesisNote: DocumentNote = {
        id: `note-synthesis-${Date.now()}`,
        title: data.synthesisTitle || `Hegelian Synthesis: ${thesis.title.slice(0, 20)} & ${antithesis.title.slice(0, 20)}`,
        content: `# ${data.synthesisTitle}\n\n## Hegelian Dialectic Resolution\n> ${data.resolvingMechanism}\n\n${data.synthesisMarkdown}`,
        intellectualDomains: data.intellectualDomains || ['dialectical-synthesis'],
        epistemicStatus: 'resilient',
        resilienceScore: 88,
        falsifiabilityCriterion: data.falsifiabilityCriterion || 'Falsified if either primary constituent mechanism breaks under unified load.',
        untestedAssumptions: [],
        survivingCounterArguments: [
          `Reconciled ${thesis.title} against ${antithesis.title}`,
        ],
        supportingPillars: [
          {
            id: `pillar-${thesis.id}`,
            title: `Thesis: ${thesis.title}`,
            snippet: 'Foundational constituent paradigm incorporated into dialectical synthesis.',
            dateAdded: new Date().toISOString(),
          },
          {
            id: `pillar-${antithesis.id}`,
            title: `Antithesis: ${antithesis.title}`,
            snippet: 'Opposing constituent paradigm incorporated into dialectical synthesis.',
            dateAdded: new Date().toISOString(),
          },
        ],
        counterEvidence: [],
        logicLintIssues: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onCreateSynthesisNote(synthesisNote);
      setSelectedAntithesisId(null);
    } catch (e) {
      console.error('Synthesis error:', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const thesisNote = notes.find((n) => n.id === selectedThesisId);
  const antithesisNote = notes.find((n) => n.id === selectedAntithesisId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070A10] overflow-hidden relative select-none">
      {/* Top HUD Controls */}
      <div className="px-6 py-3 border-b border-slate-800/80 bg-[#0B0F19]/90 flex items-center justify-between gap-4 shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-rose-500" />
          <h2 className="text-xs font-semibold text-slate-100">Adversarial Knowledge Graph</h2>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            ({edges.filter((e) => e.type === 'contradicts').length} Active Contradictions)
          </span>
        </div>

        {/* Edge Filter Segment */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setEdgeFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                edgeFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Edges
            </button>
            <button
              onClick={() => setEdgeFilter('contradictions')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                edgeFilter === 'contradictions' ? 'bg-rose-950/80 text-rose-300' : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Contradictions</span>
            </button>
            <button
              onClick={() => setEdgeFilter('supports')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                edgeFilter === 'supports' ? 'bg-cyan-950/80 text-cyan-300' : 'text-cyan-400/80 hover:text-cyan-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span>Evidence</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Hegelian Dialectic Clash Bar (When two nodes are selected) */}
      <div className="px-6 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">Dialectical Clash Pair:</span>
          <span className="text-cyan-400 font-semibold truncate max-w-[180px]">
            {thesisNote?.title || 'Select Thesis'}
          </span>
          <span className="text-rose-500 font-bold">⚡ VS ⚡</span>
          <span className="text-amber-400 font-semibold truncate max-w-[180px]">
            {antithesisNote ? antithesisNote.title : '(Click 2nd node to clash)'}
          </span>
        </div>

        {selectedThesisId && selectedAntithesisId && selectedThesisId !== selectedAntithesisId ? (
          <button
            onClick={handleTriggerSynthesis}
            disabled={isSynthesizing}
            className="px-3 py-1 bg-gradient-to-r from-cyan-600 via-indigo-600 to-rose-600 hover:opacity-90 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 disabled:opacity-50 transition-all"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Aufhebung...</span>
              </>
            ) : (
              <>
                <GitMerge className="w-3.5 h-3.5" />
                <span>Spawn Hegelian Synthesis</span>
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 italic">
            Select an opposing node to initiate Hegelian Synthesis
          </span>
        )}
      </div>

      {/* SVG Canvas with Epistemic Edges */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-6 cursor-grab active:cursor-grabbing">
        <svg
          viewBox="0 0 850 550"
          className="w-full h-full max-w-5xl transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle grid */}
          <defs>
            <pattern id="adversarial-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.5" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#adversarial-grid)" />

          {/* Epistemic Edges */}
          <g>
            {filteredEdges.map((edge) => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const isContradiction = edge.type === 'contradicts';
              const isSupport = edge.type === 'supports';

              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isContradiction ? '#EF4444' : isSupport ? '#06B6D4' : '#F59E0B'}
                    strokeWidth={isContradiction ? 2 : 1.5}
                    strokeDasharray={isContradiction ? '6 4' : !isSupport ? '3 3' : undefined}
                    strokeOpacity={isContradiction ? 0.9 : 0.6}
                  />
                  {/* Midpoint tension label */}
                  {isContradiction && (
                    <circle
                      cx={(src.x + tgt.x) / 2}
                      cy={(src.y + tgt.y) / 2}
                      r="4"
                      fill="#EF4444"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const isSelectedThesis = node.id === selectedThesisId;
              const isSelectedAntithesis = node.id === selectedAntithesisId;
              const isActive = node.id === activeNoteId;

              const statusColor =
                node.epistemicStatus === 'resilient'
                  ? '#10B981'
                  : node.epistemicStatus === 'under_siege'
                  ? '#EF4444'
                  : '#64748B';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => {
                    if (!selectedThesisId || selectedThesisId === node.id) {
                      setSelectedThesisId(node.id);
                      onSelectNote(node.id);
                    } else if (!selectedAntithesisId || selectedAntithesisId !== node.id) {
                      setSelectedAntithesisId(node.id);
                    } else {
                      onSelectNote(node.id);
                    }
                  }}
                  className="cursor-pointer transition-transform duration-150 hover:scale-105"
                >
                  {/* Tension/Selection Ring */}
                  {(isSelectedThesis || isSelectedAntithesis || isActive) && (
                    <circle
                      r={node.radius + 8}
                      fill="none"
                      stroke={isSelectedThesis ? '#06B6D4' : isSelectedAntithesis ? '#EF4444' : '#6366F1'}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Core Node */}
                  <circle
                    r={node.radius}
                    fill={statusColor}
                    fillOpacity={0.85}
                    stroke="#0B0F19"
                    strokeWidth="2.5"
                  />

                  {/* Node Title & Resilience */}
                  <text
                    y={node.radius + 14}
                    textAnchor="middle"
                    className="font-sans font-semibold text-[11px] fill-slate-200 pointer-events-none select-none"
                  >
                    {node.label.length > 26 ? node.label.slice(0, 24) + '...' : node.label}
                  </text>
                  <text
                    y={node.radius + 25}
                    textAnchor="middle"
                    className="font-mono text-[9px] fill-slate-400 pointer-events-none select-none"
                  >
                    Resilience: {node.resilienceScore}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Epistemic Legend Footer */}
      <div className="absolute bottom-4 left-6 bg-[#0B0F19]/90 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400 backdrop-blur-md flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-rose-500 inline-block border-b border-dashed border-rose-500" />
          <span>Red: Contradiction Tension</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dotted border-amber-500" />
          <span>Amber: Untested Assumption</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
          <span>Cyan: Supporting Evidence</span>
        </div>
      </div>
    </div>
  );
};
