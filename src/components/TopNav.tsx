import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, EpistemicStatus, SparringPersona } from '../types';
import {
  Eye,
  Edit3,
  Network,
  Plus,
  Share2,
  Swords,
  ShieldAlert,
  ShieldCheck,
  Bookmark,
  PanelLeftClose,
  PanelLeft,
  Flame,
  Skull,
  FlaskConical,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Gavel,
} from 'lucide-react';

interface TopNavProps {
  activeNoteId: string;
  activeNoteTitle: string;
  epistemicStatus: EpistemicStatus;
  resilienceScore: number;
  openTensionsCount: number;
  activePersona: SparringPersona;
  falsifiabilityDefined: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNewNote: () => void;
  onOpenExportModal: () => void;
  onOpenCitationsModal: () => void;
  onOpenPreMortemModal?: () => void;
  onOpenDepositionModal?: () => void;
  onResetAllTestCases: () => void;
  onSelectTestCase: (noteId: string, persona: SparringPersona) => void;
  supportingCount: number;
  counterCount: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isCopilotOpen: boolean;
  onToggleCopilot: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeNoteId,
  activeNoteTitle,
  epistemicStatus,
  resilienceScore,
  openTensionsCount,
  activePersona,
  falsifiabilityDefined: _falsifiabilityDefined,
  viewMode,
  onViewModeChange,
  onNewNote,
  onOpenExportModal,
  onOpenCitationsModal,
  onOpenPreMortemModal,
  onOpenDepositionModal,
  onResetAllTestCases,
  onSelectTestCase,
  supportingCount,
  counterCount,
  sidebarOpen,
  onToggleSidebar,
  isCopilotOpen,
  onToggleCopilot,
}) => {
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDemoDropdownOpen(false);
      }
    };
    if (isDemoDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDemoDropdownOpen]);

  // Status styling
  const statusLabels: Record<EpistemicStatus, { label: string; color: string }> = {
    unchallenged: { label: 'Unchallenged Draft', color: 'text-slate-400 border-slate-700' },
    under_siege: { label: 'Under Siege', color: 'text-rose-400 border-rose-800/80' },
    resilient: { label: 'Battle-Tested', color: 'text-emerald-400 border-emerald-800/80' },
  };

  const personaNames: Record<SparringPersona, string> = {
    cross_examiner: 'Cross-Examiner',
    bureaucratic_realist: 'Budget Director',
    empirical_criminologist: 'Criminologist',
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0A0E17]/90 backdrop-blur-md px-4 flex items-center justify-between gap-4 shrink-0 z-30">
      {/* Zone 1: Wordmark & Sidebar Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            sidebarOpen
              ? 'bg-slate-800 text-rose-400 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title={sidebarOpen ? 'Collapse Triage Queue (Ctrl+B)' : 'Expand Triage Queue (Ctrl+B)'}
          aria-label="Toggle Epistemic Triage Queue"
        >
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          <span className="text-[11px] font-medium hidden xl:inline">Triage Queue</span>
        </button>

        <div className="flex items-center gap-2 text-slate-100 font-semibold tracking-tight text-base whitespace-nowrap cursor-default">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 via-amber-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-rose-950/40">
            <Swords className="w-4 h-4" />
          </span>
          <span>CogniVault</span>
        </div>
      </div>

      {/* Zone 2: Cognitive Telemetry & View Switcher */}
      <div className="hidden md:flex items-center gap-6 min-w-0 flex-1 justify-center">
        {/* Real-time Cognitive Telemetry Bar */}
        <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums text-slate-400 truncate max-w-xl">
          <span className="text-slate-200 font-sans font-medium truncate max-w-[140px]" title={activeNoteTitle}>
            {activeNoteTitle || 'CogniVault Thesis'}
          </span>

          <span aria-hidden="true" className="text-slate-700">·</span>

          {/* Epistemic Status Indicator */}
          <span className={`${statusLabels[epistemicStatus].color} font-sans font-medium flex items-center gap-1`}>
            {epistemicStatus === 'resilient' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : epistemicStatus === 'under_siege' ? (
              <Flame className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{statusLabels[epistemicStatus].label}</span>
          </span>

          <span aria-hidden="true" className="text-slate-700">·</span>

          {/* Resilience Score */}
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Resilience:</span>
            <span className={resilienceScore >= 75 ? 'text-emerald-400 font-bold' : resilienceScore >= 50 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
              {resilienceScore}%
            </span>
          </span>

          <span aria-hidden="true" className="text-slate-700">·</span>

          {/* Open Tensions */}
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Tensions:</span>
            <span className={openTensionsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {openTensionsCount}
            </span>
          </span>

          <span aria-hidden="true" className="text-slate-700">·</span>

          {/* Persona */}
          <span className="text-slate-400 hidden lg:inline">
            <span className="text-slate-600">Opponent: </span>
            <span className="text-cyan-400">{personaNames[activePersona]}</span>
          </span>
        </div>

        {/* View mode segmented switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900/90 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => onViewModeChange('edit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'edit'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Markdown Source Editor with Logic Linter"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit / Source</span>
          </button>

          <button
            onClick={() => onViewModeChange('canvas')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'canvas'
                ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Rendered Battleground Reading Canvas"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Battleground Canvas</span>
          </button>

          <button
            onClick={() => onViewModeChange('graph')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'graph'
                ? 'bg-slate-800 text-rose-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Adversarial Knowledge Graph"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Tension Graph</span>
          </button>
        </div>
      </div>

      {/* Zone 3: Actions Group, Demo Mode Dropdown & Adversarial Copilot Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reviewer Demo Mode / Load Test Cases Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDemoDropdownOpen((prev) => !prev)}
            className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-100 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/80 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="Reviewer Demo Mode: Load Domain Test Cases & Active Flaws"
            aria-haspopup="true"
            aria-expanded={isDemoDropdownOpen}
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Demo Mode</span>
            <ChevronDown className={`w-3 h-3 text-amber-400/80 transition-transform ${isDemoDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDemoDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-88 max-w-[95vw] bg-[#0C1220] border border-amber-600/60 rounded-xl shadow-2xl shadow-black/90 z-50 overflow-hidden text-left animate-fadeIn">
              {/* Header */}
              <div className="p-3 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold tracking-wide text-amber-200 uppercase font-mono">
                      Domain Test Cases & Sandbox
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    Reviewer Tool
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Reset and test all 3 research dossiers with pre-populated logic flaws, ungrounded assertions, and open dialectical tensions.
                </p>
              </div>

              {/* Master Reset Button */}
              <div className="p-2.5 border-b border-slate-800/80 bg-slate-900/60">
                <button
                  onClick={() => {
                    onResetAllTestCases();
                    setIsDemoDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm font-sans"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                  <span>Reset All 3 Dossiers (Fresh Test Suite)</span>
                </button>
              </div>

              {/* Individual Dossier Quick-Load */}
              <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-mono font-semibold">
                  Select Specific Dossier
                </div>

                {/* Case 1: Eyewitness */}
                <button
                  onClick={() => {
                    onSelectTestCase('note-eyewitness-contamination', 'cross_examiner');
                    setIsDemoDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg text-left transition-colors border flex flex-col gap-1 ${
                    activeNoteId === 'note-eyewitness-contamination'
                      ? 'bg-rose-950/40 border-rose-700/80 text-rose-200'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {activeNoteId === 'note-eyewitness-contamination' && (
                        <CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" />
                      )}
                      1. Eyewitness Contamination
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800 font-mono">
                      2 Flaws
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    Reid vs PEACE, reconstructive memory, State v. Henderson
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/90 mt-0.5">
                    <span>⚔ Opponent:</span>
                    <span className="text-slate-300">The Hostile Cross-Examiner</span>
                  </div>
                </button>

                {/* Case 2: COMPAS */}
                <button
                  onClick={() => {
                    onSelectTestCase('note-compas-algorithms', 'empirical_criminologist');
                    setIsDemoDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg text-left transition-colors border flex flex-col gap-1 ${
                    activeNoteId === 'note-compas-algorithms'
                      ? 'bg-cyan-950/40 border-cyan-700/80 text-cyan-200'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {activeNoteId === 'note-compas-algorithms' && (
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                      )}
                      2. COMPAS Risk Instruments
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono">
                      2 Flaws
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    Predictive parity vs FPR, arrest proxies, 14th Amend.
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/90 mt-0.5">
                    <span>⚔ Opponent:</span>
                    <span className="text-slate-300">The Empirical Criminologist</span>
                  </div>
                </button>

                {/* Case 3: Net-Widening */}
                <button
                  onClick={() => {
                    onSelectTestCase('note-net-widening-policy', 'bureaucratic_realist');
                    setIsDemoDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg text-left transition-colors border flex flex-col gap-1 ${
                    activeNoteId === 'note-net-widening-policy'
                      ? 'bg-amber-950/40 border-amber-700/80 text-amber-200'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                      {activeNoteId === 'note-net-widening-policy' && (
                        <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                      3. Decarceration Net-Widening
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-800 font-mono">
                      Popper Gate
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    GPS monitoring, street-level drift, zero falsifiability criterion
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/90 mt-0.5">
                    <span>⚔ Opponent:</span>
                    <span className="text-slate-300">The Bureaucratic Realist</span>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="p-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3 h-3" />
                  Live Linter & Telemetry Active
                </span>
                <span>Press Esc to close</span>
              </div>
            </div>
          )}
        </div>

        {onOpenPreMortemModal && (
          <button
            onClick={onOpenPreMortemModal}
            className="px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="Simulate 3-Year Operational Policy Pre-Mortem & Unintended Consequences Audit"
          >
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Pre-Mortem</span>
          </button>
        )}

        {onOpenDepositionModal && (
          <button
            onClick={onOpenDepositionModal}
            className="px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-100 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            title="Enter 3-Minute Under-Oath Deposition & Cross-Examination Hearing"
          >
            <Gavel className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Deposition</span>
          </button>
        )}

        <button
          onClick={onOpenCitationsModal}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Manage Supporting Pillars and Counter-Evidence"
        >
          <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evidence</span>
          <span className="font-mono tabular-nums text-[11px] text-slate-400">
            ({supportingCount} | <span className="text-rose-400">{counterCount}</span>)
          </span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Export Epistemic Audit Report"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Audit Export</span>
        </button>

        <button
          onClick={onNewNote}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Create New Thesis Draft"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Thesis</span>
        </button>

        <button
          onClick={onToggleCopilot}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap border ${
            isCopilotOpen
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/40'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-slate-100 hover:border-slate-700'
          }`}
          title="Open Dialectical Sparring Arena"
        >
          <Swords className={`w-3.5 h-3.5 ${isCopilotOpen ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>Sparring Arena</span>
        </button>
      </div>
    </header>
  );
};
