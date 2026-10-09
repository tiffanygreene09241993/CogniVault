import React, { useEffect, useRef, useState } from 'react';
import { DocumentNote, PreMortemReport } from '../types';
import { withSession } from '../lib/session';
import {
  Skull,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PlusCircle,
  Loader2,
  X,
  FileCheck,
  Building2,
  ArrowRight,
  TrendingDown,
  Copy,
  Check,
} from 'lucide-react';

interface PreMortemModalProps {
  note: DocumentNote;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (updated: DocumentNote) => void;
}

export const PreMortemModal: React.FC<PreMortemModalProps> = ({
  note,
  isOpen,
  onClose,
  onUpdateNote,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<PreMortemReport | null>(note.session?.preMortem ?? null);
  const noteRef = useRef(note);
  noteRef.current = note;
  const updateRef = useRef(onUpdateNote);
  updateRef.current = onUpdateNote;
  const skipReportPersist = useRef(true);
  const [hasInserted, setHasInserted] = useState(false);
  const [copiedClauseIndices, setCopiedClauseIndices] = useState<Set<number>>(new Set());
  const [insertedClauseIndices, setInsertedClauseIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (skipReportPersist.current) {
      skipReportPersist.current = false;
      return;
    }
    if (!report) return;
    updateRef.current(withSession(noteRef.current, { preMortem: report }));
  }, [report]);

  if (!isOpen) return null;

  // Run the 3-Year Pre-Mortem Audit
  const handleRunPreMortem = async () => {
    setIsLoading(true);
    setHasInserted(false);
    try {
      const response = await fetch('/api/gemini/policy-pre-mortem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          intellectualDomains: note.intellectualDomains,
        }),
      });

      if (!response.ok) throw new Error('Failed to run policy pre-mortem');
      const data = await response.json();
      setReport(data);
    } catch (e) {
      console.error('Pre-mortem error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Insert defensive clauses into the draft note
  const handleInsertDefensiveClauses = () => {
    if (!report || report.defensiveClauses.length === 0) return;

    const formattedAppendix = `\n\n## Defensive Policy Clauses (Pre-Mortem Insulation)\n> These statutory safeguards were synthesized during the 3-Year Unintended Consequences Audit to prevent street-level discretion drift and administrative attrition.\n\n${report.defensiveClauses.map((c, i) => `### Clause ${i + 1}: Statutory Guardrail\n${c}`).join('\n\n')}\n`;

    onUpdateNote({
      ...note,
      content: note.content + formattedAppendix,
      resilienceScore: Math.min(100, note.resilienceScore + 10),
      survivingCounterArguments: [
        ...note.survivingCounterArguments,
        `Insulated against Year 3 collapse: ${report.executiveAutopsy.slice(0, 100)}...`,
      ],
      updatedAt: new Date().toISOString(),
    });

    setHasInserted(true);
  };

  // Copy single safeguard clause to clipboard
  const handleCopySingleClause = (clause: string, idx: number) => {
    const textToCopy = `### Defensive Policy Guardrail: Covenant § ${idx + 1}\n> Synthesized during the 3-Year Policy Pre-Mortem Audit\n\n${clause}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedClauseIndices((prev) => new Set(prev).add(idx));
    setTimeout(() => {
      setCopiedClauseIndices((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }, 2500);
  };

  // Insert single safeguard clause directly into draft
  const handleInsertSingleClause = (clause: string, idx: number) => {
    const formatted = `\n\n### Defensive Policy Guardrail: Covenant § ${idx + 1}\n> **Statutory Purpose:** Synthesized during 3-Year Policy Pre-Mortem Audit to inoculate against street-level discretion drift and administrative attrition.\n\n${clause}\n`;

    onUpdateNote({
      ...note,
      content: note.content + formatted,
      resilienceScore: Math.min(100, note.resilienceScore + 5),
      survivingCounterArguments: [
        ...note.survivingCounterArguments,
        `Insulated with Guardrail Covenant § ${idx + 1}: ${clause.slice(0, 80)}...`,
      ],
      updatedAt: new Date().toISOString(),
    });

    setInsertedClauseIndices((prev) => new Set(prev).add(idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0A0E17]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>3-Year Policy Pre-Mortem Simulator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                  Unintended Consequences Audit
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Simulating Year 3 catastrophic implementation failure & generating statutory insulation
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!report && !isLoading ? (
            <div className="py-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  Auditing: "{note.title}"
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  In public administration and criminal justice, policies rarely fail on theory—they collapse from <strong>street-level discretion drift</strong>, <strong>administrative burden</strong>, and <strong>budget cliffs</strong>.
                </p>
              </div>
              <button
                onClick={handleRunPreMortem}
                className="px-4 py-2 bg-gradient-to-r from-rose-700 via-amber-700 to-rose-700 hover:opacity-90 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-rose-950/50"
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Simulate 3-Year Failure Autopsy</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-rose-400 mx-auto" />
              <p className="text-xs font-medium text-slate-300">
                Simulating municipal bureaucrat pushback & fiscal cliff impact...
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Auditing Lipsky street-level discretion, union bargaining, and net-widening traps.
              </p>
            </div>
          ) : report ? (
            <div className="space-y-5">
              {/* Executive Autopsy Card */}
              <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span>Executive Autopsy (Post-Mortem from 2029)</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-rose-400">
                    Vulnerability Index: {report.vulnerabilityScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{report.executiveAutopsy}"
                </p>
              </div>

              {/* 3-Year Timeline of Collapse */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">
                  Chronology of Unintended Consequences:
                </span>
                <div className="space-y-2.5">
                  {report.timeline.map((item) => (
                    <div
                      key={item.year}
                      className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-start gap-3"
                    >
                      <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-amber-400 shrink-0">
                        Year {item.year}
                      </div>
                      <div className="space-y-1 flex-1 text-xs">
                        <div className="font-semibold text-slate-200">{item.phase}</div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          <strong className="text-amber-400/90">Bottleneck: </strong>
                          {item.bottleneck}
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          <strong className="text-cyan-400/90">Unmodeled Discretion: </strong>
                          {item.unmodeledBehavior}
                        </p>
                        <p className="text-rose-300/90 text-[11px] leading-relaxed">
                          <strong className="text-rose-400">Impact: </strong>
                          {item.catastrophicImpact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defensive Clauses for Policy Insulation */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Synthesized Defensive Policy Clauses</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {report.defensiveClauses.length} Covenants Generated
                  </span>
                </div>

                <div className="space-y-3">
                  {report.defensiveClauses.map((clause, idx) => {
                    const isCopied = copiedClauseIndices.has(idx);
                    const isInserted = insertedClauseIndices.has(idx);

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono leading-relaxed space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-sans font-bold text-emerald-400">
                            Clause § {idx + 1}: Guardrail Covenant
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Statutory Guardrail
                          </span>
                        </div>

                        <p className="bg-[#050811] p-2.5 rounded border border-slate-900 select-text leading-relaxed text-slate-300">
                          {clause}
                        </p>

                        {/* Explicit Action Buttons Under Each Clause */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                          <button
                            onClick={() => handleCopySingleClause(clause, idx)}
                            className={`py-1 px-2.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors border ${
                              isCopied
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                                : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-slate-100 border-slate-800'
                            }`}
                            title="Copy this safeguard clause to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-cyan-400" />
                                <span>✓ Copied to Clipboard</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Clause to Clipboard</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleInsertSingleClause(clause, idx)}
                            disabled={isInserted}
                            className={`py-1 px-2.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all shadow-xs ${
                              isInserted
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                            }`}
                            title="Insert this safeguard directly into the draft thesis"
                          >
                            {isInserted ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>✓ Inserted into Draft</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Insert into Draft</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleInsertDefensiveClauses}
                  disabled={hasInserted}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    hasInserted
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>
                    {hasInserted ? '✓ Clauses Inserted into Note' : 'Insert Defensive Clauses into Note (+10 Resilience)'}
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0A0E17] flex items-center justify-between text-xs">
          {report && (
            <button
              onClick={handleRunPreMortem}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-200 text-[11px]"
            >
              Re-simulate Autopsy
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
