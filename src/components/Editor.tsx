import React, { useState, useRef } from 'react';
import { DocumentNote, ViewMode, LogicLintIssue } from '../types';
import { MarkdownPreview } from './MarkdownPreview';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  Quote,
  List,
  Table,
  Swords,
  Bookmark,
  Check,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  X,
  Sparkles,
  Edit3,
  Eye,
} from 'lucide-react';

interface EditorProps {
  note: DocumentNote;
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onUpdateNote: (updated: DocumentNote) => void;
  onOpenCitationsModal: () => void;
  onOpenCopilot: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  viewMode,
  onViewModeChange,
  onUpdateNote,
  onOpenCitationsModal,
  onOpenCopilot,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLinting, setIsLinting] = useState(false);
  const [activeLintIssue, setActiveLintIssue] = useState<LogicLintIssue | null>(null);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [isFalsifySuggesting, setIsFalsifySuggesting] = useState(false);

  // Content change
  const handleContentChange = (newContent: string) => {
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString(),
    });
  };

  // Title change
  const handleTitleChange = (newTitle: string) => {
    onUpdateNote({
      ...note,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    });
  };

  // Falsifiability Criterion change
  const handleFalsifiabilityChange = (criterion: string) => {
    let nextStatus = note.epistemicStatus;
    if (!criterion.trim() && note.epistemicStatus === 'resilient') {
      nextStatus = note.counterEvidence.length > 0 ? 'under_siege' : 'unchallenged';
    } else if (criterion.trim() && note.resilienceScore >= 75 && note.counterEvidence.length > 0) {
      nextStatus = 'resilient';
    }

    onUpdateNote({
      ...note,
      falsifiabilityCriterion: criterion,
      epistemicStatus: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add Domain
  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    const clean = newDomainInput.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
    if (!note.intellectualDomains.includes(clean)) {
      onUpdateNote({
        ...note,
        intellectualDomains: [...note.intellectualDomains, clean],
        updatedAt: new Date().toISOString(),
      });
    }
    setNewDomainInput('');
    setShowAddDomain(false);
  };

  // Remove Domain
  const handleRemoveDomain = (domain: string) => {
    onUpdateNote({
      ...note,
      intellectualDomains: note.intellectualDomains.filter((d) => d !== domain),
      updatedAt: new Date().toISOString(),
    });
  };

  // Trigger Logic Linter
  const handleRunLogicLint = async () => {
    setIsLinting(true);
    setActiveLintIssue(null);
    try {
      const response = await fetch('/api/gemini/logic-lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Lint failed with status ${response.status}`);
      }

      const data = await response.json();
      const newScore = data.overallResilienceScore ?? note.resilienceScore;

      let nextStatus = note.epistemicStatus;
      if (newScore >= 75 && note.falsifiabilityCriterion.trim() && note.counterEvidence.length > 0) {
        nextStatus = 'resilient';
      } else if (data.issues.length > 0 || note.counterEvidence.length > 0) {
        nextStatus = 'under_siege';
      }

      onUpdateNote({
        ...note,
        resilienceScore: newScore,
        untestedAssumptions: data.untestedAssumptions || note.untestedAssumptions,
        logicLintIssues: data.issues || [],
        epistemicStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Logic lint error:', err);
    } finally {
      setIsLinting(false);
    }
  };

  // Suggest Falsification Criterion using Gemini
  const handleSuggestFalsification = async () => {
    setIsFalsifySuggesting(true);
    try {
      const response = await fetch('/api/gemini/spar-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: 'skeptic',
          noteTitle: note.title,
          noteContent: note.content,
          userMessage: 'Formulate a rigorous, falsifiable Popperian empirical criterion for this thesis. State the exact test conditions.',
          history: [],
          falsifiabilityCriterion: '',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate falsification test');
      const data = await response.json();
      if (data.suggestedFalsificationTest) {
        handleFalsifiabilityChange(data.suggestedFalsificationTest);
      }
    } catch (e) {
      console.error('Falsification suggestion error:', e);
    } finally {
      setIsFalsifySuggesting(false);
    }
  };

  // Adopt steel-man rebuttal from a lint issue directly into the note
  const handleAdoptRebuttal = (issue: LogicLintIssue) => {
    if (!issue.suggestedRebuttal) return;
    const current = note.content;
    const nextContent = current.includes(issue.passage)
      ? current.replace(issue.passage, issue.suggestedRebuttal)
      : `${current}\n\n> Rebuttal Nuance: ${issue.suggestedRebuttal}`;

    const remainingIssues = note.logicLintIssues.filter((i) => i.id !== issue.id);
    const updatedScore = Math.min(100, note.resilienceScore + 5);

    onUpdateNote({
      ...note,
      content: nextContent,
      logicLintIssues: remainingIssues,
      resilienceScore: updatedScore,
      survivingCounterArguments: [...note.survivingCounterArguments, issue.explanation],
      updatedAt: new Date().toISOString(),
    });

    setActiveLintIssue(null);
  };

  // Convert an ungrounded assertion to an explicit untested assumption
  const handlePromoteToAssumption = (issue: LogicLintIssue) => {
    const updatedAssumptions = [...note.untestedAssumptions, issue.passage];
    const remainingIssues = note.logicLintIssues.filter((i) => i.id !== issue.id);

    onUpdateNote({
      ...note,
      untestedAssumptions: updatedAssumptions,
      logicLintIssues: remainingIssues,
      updatedAt: new Date().toISOString(),
    });

    setActiveLintIssue(null);
  };

  // Formatting insert helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = note.content;
    const selection = current.substring(start, end);

    const replacement = prefix + (selection || 'text') + suffix;
    const nextContent = current.substring(0, start) + replacement + current.substring(end);

    handleContentChange(nextContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + (selection.length || 4));
      }
    }, 10);
  };

  const isResilientEligible = note.falsifiabilityCriterion.trim().length > 0 && note.counterEvidence.length > 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full bg-[#0A0E17] overflow-hidden relative">
      {/* Document Header & Epistemic Taxonomy */}
      <div className="px-6 pt-4 pb-3.5 border-b border-slate-800/80 bg-[#0B0F19]/60 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {/* Top Title & View Switcher Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
            <input
              type="text"
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="CogniVault Research Thesis..."
              className="flex-1 min-w-0 truncate text-xl font-bold tracking-tight text-slate-100 placeholder:text-slate-600 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
              title={note.title}
            />

            {/* Segment Control Toggle: [ Edit / Source ] vs [ Battleground Canvas ] */}
            {onViewModeChange && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => onViewModeChange('edit')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'edit'
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Raw markdown editing & logic linting"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit / Source</span>
                </button>
                <button
                  onClick={() => onViewModeChange('canvas')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    viewMode === 'canvas'
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Rendered battleground reading canvas"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Battleground Canvas</span>
                </button>
              </div>
            )}
          </div>

          {/* Intellectual Domains Row */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider font-mono">Domains:</span>
            {note.intellectualDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 text-[11px] text-cyan-300 font-mono"
              >
                #{domain}
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="text-slate-500 hover:text-rose-400 ml-0.5"
                  title={`Remove #${domain}`}
                >
                  ×
                </button>
                <span aria-hidden="true" className="text-slate-700 ml-1">·</span>
              </span>
            ))}

            {showAddDomain ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="domain-name..."
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-1.5 py-0.5 rounded focus:outline-none font-mono"
                  autoFocus
                />
                <button onClick={handleAddDomain} className="text-cyan-400 text-xs hover:underline">Add</button>
                <button onClick={() => setShowAddDomain(false)} className="text-slate-500 text-xs hover:text-slate-300">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddDomain(true)}
                className="text-slate-500 hover:text-cyan-400 text-[11px] font-mono transition-colors"
              >
                + Add Domain
              </button>
            )}

            <span aria-hidden="true" className="text-slate-700 ml-auto">|</span>

            {/* Quick Epistemic Status Switcher */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Epistemic Status:</span>
              <select
                value={note.epistemicStatus}
                onChange={(e) => {
                  const targetStatus = e.target.value as any;
                  if (targetStatus === 'resilient' && !isResilientEligible) {
                    alert('Cannot promote to Battle-Tested (Resilient): You must articulate a falsifiability criterion and have at least one counter-evidence citation.');
                    return;
                  }
                  onUpdateNote({ ...note, epistemicStatus: targetStatus });
                }}
                className={`bg-slate-900 border rounded px-2 py-0.5 text-[11px] font-medium focus:outline-none ${
                  note.epistemicStatus === 'resilient'
                    ? 'border-emerald-800 text-emerald-400'
                    : note.epistemicStatus === 'under_siege'
                    ? 'border-rose-800 text-rose-400'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                <option value="unchallenged">Unchallenged Draft</option>
                <option value="under_siege">Under Siege (In Sparring)</option>
                <option value="resilient">Battle-Tested (Resilient)</option>
              </select>
            </div>
          </div>

          {/* DEDICATED POPPERIAN FALSIFIABILITY CRITERION CARD */}
          <div className="p-3 bg-gradient-to-r from-slate-950 via-[#0B1220] to-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2.5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    note.falsifiabilityCriterion.trim()
                      ? 'bg-emerald-950/80 border border-emerald-700/80 text-emerald-400'
                      : 'bg-rose-950/80 border border-rose-700/80 text-rose-400'
                  }`}
                >
                  {note.falsifiabilityCriterion.trim() ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-200">
                    Popperian Falsifiability Criterion
                  </span>
                  {note.falsifiabilityCriterion.trim() ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono">
                      ✓ Verified Falsifiable
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80 font-mono animate-pulse">
                      ⚠ Unfalsifiable Dogma (Resilience Blocked)
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSuggestFalsification}
                disabled={isFalsifySuggesting}
                className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/80 text-indigo-300 hover:text-indigo-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                title="Generate empirical test conditions with The Skeptic"
              >
                {isFalsifySuggesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Suggest with The Skeptic</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={2}
                placeholder="Define what empirical observation or statutory precedent would prove this claim false to unlock Resilient status."
                value={note.falsifiabilityCriterion}
                onChange={(e) => handleFalsifiabilityChange(e.target.value)}
                className="w-full bg-[#070A10] border border-slate-800/90 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80 font-mono leading-relaxed resize-none"
              />
            </div>

            {!note.falsifiabilityCriterion.trim() ? (
              <div className="p-2 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 font-mono flex items-start gap-1.5 leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Define what empirical observation or statutory precedent would prove this claim false to unlock Resilient status.</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 font-mono">
                Observable condition recorded for Epistemic Audit verification.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formatting & Logic Linter Bar (Visible in Edit mode) */}
      {viewMode === 'edit' && (
        <div className="h-10 px-6 border-b border-slate-800/80 bg-[#0B0F19]/80 flex items-center justify-between gap-4 shrink-0 text-slate-400">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-800 mx-1" />
            <button
              onClick={() => insertFormatting('# ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('## ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-800 mx-1" />
            <button
              onClick={() => insertFormatting('```\n', '\n```')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Code Block"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('> ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('- ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('\n| Premise | Empirical Support | Falsifier |\n| :--- | :--- | :--- |\n| Core claim | Primary paper [1] | Negative trial |\n')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Evidence Table"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenCitationsModal}
              className="p-1.5 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-xs"
              title="Attach Supporting Pillar or Counter-Evidence"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] hidden sm:inline">Evidence</span>
            </button>
          </div>

          {/* Logic-Linter & Sparring Launchers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunLogicLint}
              disabled={isLinting}
              className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded-md text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Scan text for ungrounded assertions and logical fallacies"
            >
              {isLinting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing Logic...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logic Linter ({note.logicLintIssues.length})</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenCopilot}
              className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-md text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Open Red-Team Sparring Arena"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>Spar Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Logic Linter Issues Ribbon (Clickable semantic heatmap items) */}
      {viewMode === 'edit' && note.logicLintIssues.length > 0 && (
        <div className="px-6 py-2 bg-amber-950/20 border-b border-amber-900/30 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-mono text-amber-400 font-bold shrink-0">
            Detected Flaws:
          </span>
          {note.logicLintIssues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => setActiveLintIssue(issue)}
              className={`px-2 py-0.5 text-[11px] rounded transition-colors whitespace-nowrap flex items-center gap-1 border shrink-0 ${
                issue.type === 'ungrounded_assertion'
                  ? 'border-amber-700/80 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60'
                  : 'border-rose-700/80 bg-rose-950/40 text-rose-200 hover:bg-rose-900/60'
              }`}
            >
              <span>{issue.type === 'ungrounded_assertion' ? 'Ungrounded Assertion' : 'Logical Leap'}</span>
              <span className="text-[10px] opacity-75 truncate max-w-[120px]">("{issue.passage.slice(0, 20)}...")</span>
            </button>
          ))}
        </div>
      )}

      {/* Active Lint Issue Popover / Action Modal */}
      {activeLintIssue && (
        <div className="absolute top-44 right-8 z-30 bg-[#0F172A] border border-amber-700/80 shadow-2xl rounded-lg p-3.5 max-w-md w-full animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Logic Linter: {activeLintIssue.type.replace('_', ' ').toUpperCase()}</span>
            </div>
            <button
              onClick={() => setActiveLintIssue(null)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs text-amber-100/90 italic bg-slate-900/80 p-2 rounded border border-slate-800 mb-2 leading-relaxed">
            "{activeLintIssue.passage}"
          </div>

          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            <strong className="text-amber-400">Diagnosis: </strong>
            {activeLintIssue.explanation}
          </p>

          {activeLintIssue.suggestedRebuttal && (
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono mb-3">
              <span className="text-[10px] uppercase text-cyan-400 font-sans block mb-1">Steel-Man Resolution Phrasing:</span>
              {activeLintIssue.suggestedRebuttal}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={() => handlePromoteToAssumption(activeLintIssue)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              title="Declare as an explicit untested assumption"
            >
              Declare as Assumption
            </button>
            {activeLintIssue.suggestedRebuttal ? (
              <button
                onClick={() => handleAdoptRebuttal(activeLintIssue)}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Adopt Rebuttal into Text</span>
              </button>
            ) : (
              <button
                onClick={onOpenCitationsModal}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium flex items-center gap-1"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Attach Empirical Citation</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace: ONLY ONE VIEW ACTIVE AT A TIME (No vertical or horizontal squishing!) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* VIEW 1: RAW EDIT / SOURCE VIEW */}
        {viewMode === 'edit' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-6 py-2 bg-[#0B0F19]/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
              <span>MARKDOWN SOURCE EDITOR</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {note.logicLintIssues.length === 0 ? '✓ No logic flags' : `⚠ ${note.logicLintIssues.length} unverified claims`}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Draft your core thesis and empirical arguments in Markdown..."
              className="flex-1 w-full p-6 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-rose-500/25 selection:text-rose-100"
              spellCheck={false}
            />
          </div>
        )}

        {/* VIEW 2: BATTLEGROUND RENDERED READING CANVAS */}
        {viewMode === 'canvas' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0E17]/60">
            <div className="px-6 py-2 bg-[#0B0F19]/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
              <span>BATTLEGROUND CANVASES (RENDERED)</span>
              <span className="text-[10px] text-slate-400">
                Epistemic Status: <strong className="text-slate-200">{note.epistemicStatus.toUpperCase()}</strong>
              </span>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <MarkdownPreview content={note.content} onCitationClick={() => onOpenCitationsModal()} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cognitive Telemetry Footer */}
      <footer className="min-h-9 py-1 px-6 border-t border-slate-800/80 bg-[#0B0F19] flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-[11px] font-mono text-slate-400 shrink-0 select-none tabular-nums overflow-x-auto">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 font-semibold whitespace-nowrap">
            <span className="text-slate-500">Resilience Index:</span>
            <span className={note.resilienceScore >= 75 ? 'text-emerald-400' : note.resilienceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}>
              {note.resilienceScore}%
            </span>
          </span>
          <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>
          <span className="whitespace-nowrap">{note.untestedAssumptions.length} Untested Assumptions</span>
          <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>
          <span className="whitespace-nowrap">{note.survivingCounterArguments.length} Surviving Rebuttals</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="whitespace-nowrap">{note.supportingPillars.length} Supporting Pillars</span>
          <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>
          <span className={`whitespace-nowrap ${note.counterEvidence.length > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
            {note.counterEvidence.length} Counter-Evidence
          </span>
          <span aria-hidden="true" className="text-slate-700 hidden sm:inline">·</span>
          <span className={`whitespace-nowrap ${note.falsifiabilityCriterion.trim() ? 'text-emerald-400' : 'text-amber-400'}`}>
            {note.falsifiabilityCriterion.trim() ? 'Popperian' : 'Speculative'}
          </span>
        </div>
      </footer>
    </div>
  );
};
