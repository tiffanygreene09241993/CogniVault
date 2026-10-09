import React, { useState } from 'react';
import { DocumentNote, SparringPersona, DefenseClause } from '../types';
import {
  Gavel,
  Scale,
  Building2,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  Copy,
  Check,
  Loader2,
  X,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DepositionModalProps {
  note: DocumentNote;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (updated: DocumentNote) => void;
  initialPersona?: SparringPersona;
}

export const DepositionModal: React.FC<DepositionModalProps> = ({
  note,
  isOpen,
  onClose,
  onUpdateNote,
  initialPersona = 'cross_examiner',
}) => {
  const [activePersona, setActivePersona] = useState<SparringPersona>(initialPersona);
  const [round, setRound] = useState(1);
  const [exchanges, setExchanges] = useState<Array<{ question: string; answer: string; target: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [targetVulnerability, setTargetVulnerability] = useState<string | null>(null);
  const [witnessDefenseInput, setWitnessDefenseInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedClauseIds, setCopiedClauseIds] = useState<Set<string>>(new Set());
  const [insertedClauseIds, setInsertedClauseIds] = useState<Set<string>>(new Set());
  const [isTranscriptAppended, setIsTranscriptAppended] = useState(false);

  const [depositionResult, setDepositionResult] = useState<{
    survivalScore: number;
    witnessAssessment: string;
    defenseClauses?: DefenseClause[];
  } | null>(null);

  if (!isOpen) return null;

  const personas = [
    {
      id: 'cross_examiner' as SparringPersona,
      name: 'Cross-Examiner',
      subtitle: 'Hostile Counsel',
      icon: Scale,
      role: 'Opposing Counsel',
      attackVector: 'Chain of custody, cognitive bias, suggestive interviewing (Reid vs PEACE), Daubert admissibility.',
    },
    {
      id: 'bureaucratic_realist' as SparringPersona,
      name: 'Budget Director',
      subtitle: 'Bureaucratic Realist',
      icon: Building2,
      role: 'Municipal Comptroller',
      attackVector: 'Unfunded mandates, Year 2/3 grant cliffs, police/union friction, street-level discretion drift.',
    },
    {
      id: 'empirical_criminologist' as SparringPersona,
      name: 'Criminologist',
      subtitle: 'Methodologist',
      icon: Gavel,
      role: 'Lead Statistician',
      attackVector: 'Sampling bias, regression to the mean, ecological fallacies in NIBRS/UCR data, confounding variables.',
    },
  ];

  // Start Deposition Hearing
  const handleStartHearing = async () => {
    setIsLoading(true);
    setRound(1);
    setExchanges([]);
    setDepositionResult(null);
    setCopiedClauseIds(new Set());
    setInsertedClauseIds(new Set());
    setIsTranscriptAppended(false);

    try {
      const response = await fetch('/api/gemini/deposition-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: personas.find((p) => p.id === activePersona)?.name,
          noteTitle: note.title,
          noteContent: note.content,
          round: 1,
          priorExchanges: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate hearing challenge');
      const data = await response.json();
      setCurrentQuestion(data.nextQuestion || 'State under oath your statutory and empirical foundation for this thesis.');
      setTargetVulnerability(data.targetVulnerability || 'Foundational Evidentiary Admissibility');
    } catch (err) {
      console.error('Deposition start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit testimony defense to current question
  const handleSubmitDefense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!witnessDefenseInput.trim() || !currentQuestion) return;

    const answer = witnessDefenseInput.trim();
    setWitnessDefenseInput('');

    const updatedExchanges = [
      ...exchanges,
      {
        question: currentQuestion,
        answer,
        target: targetVulnerability || 'Evidentiary Chain',
      },
    ];
    setExchanges(updatedExchanges);

    const nextRound = round + 1;
    setRound(nextRound);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/deposition-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: personas.find((p) => p.id === activePersona)?.name,
          noteTitle: note.title,
          noteContent: note.content,
          round: nextRound,
          priorExchanges: updatedExchanges,
          userDefense: answer,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit defense');
      const data = await response.json();

      if (data.isFinal || nextRound > 3) {
        setDepositionResult({
          survivalScore: data.survivalScore || 70,
          witnessAssessment: data.witnessAssessment || 'The witness defended the central empirical pillars under cross-examination.',
          defenseClauses: data.defenseClauses || [],
        });
        setCurrentQuestion(null);

        // Adjust note resilience score with survival outcome
        onUpdateNote({
          ...note,
          resilienceScore: Math.round((note.resilienceScore + (data.survivalScore || 70)) / 2),
          survivingCounterArguments: [
            ...note.survivingCounterArguments,
            `Survives Under-Oath Deposition (${data.survivalScore || 70}%): ${(data.witnessAssessment || '').slice(0, 90)}...`,
          ],
          updatedAt: new Date().toISOString(),
        });
      } else {
        setCurrentQuestion(data.nextQuestion);
        setTargetVulnerability(data.targetVulnerability);
      }
    } catch (err) {
      console.error('Deposition submit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit Copy Clause to Clipboard
  const handleCopyClause = (clause: DefenseClause) => {
    const textToCopy = `### Inoculation Defense Clause: ${clause.title}\n> Statutory/Precedent Foundation: ${clause.statutoryBasisOrPrecedent}\n\n${clause.clauseText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedClauseIds((prev) => new Set(prev).add(clause.id));
    setTimeout(() => {
      setCopiedClauseIds((prev) => {
        const next = new Set(prev);
        next.delete(clause.id);
        return next;
      });
    }, 2500);
  };

  // Explicit Insert into Draft
  const handleInsertClauseIntoDraft = (clause: DefenseClause) => {
    const formatted = `\n\n### Inoculation Safeguard: ${clause.title}\n> **Statutory/Precedent Authority:** ${clause.statutoryBasisOrPrecedent}\n\n${clause.clauseText}\n`;

    onUpdateNote({
      ...note,
      content: note.content + formatted,
      resilienceScore: Math.min(100, note.resilienceScore + 5),
      survivingCounterArguments: [
        ...note.survivingCounterArguments,
        `Inoculated with ${clause.title} (${clause.statutoryBasisOrPrecedent})`,
      ],
      updatedAt: new Date().toISOString(),
    });

    setInsertedClauseIds((prev) => new Set(prev).add(clause.id));
  };

  // Append entire deposition transcript to draft
  const handleAppendTranscript = () => {
    if (!depositionResult) return;

    const transcript = `\n\n## Expert Witness Deposition Record (${personas.find((p) => p.id === activePersona)?.name})\n**Cross-Examination Survival Score:** ${depositionResult.survivalScore}%\n\n> **Inquisitor Verdict:** ${depositionResult.witnessAssessment}\n\n### Deposition Transcripts:\n${exchanges.map((ex, i) => `**Q${i + 1} [Flaw: ${ex.target}]:** ${ex.question}\n*Witness Testimony:* ${ex.answer}`).join('\n\n')}\n`;

    onUpdateNote({
      ...note,
      content: note.content + transcript,
      updatedAt: new Date().toISOString(),
    });

    setIsTranscriptAppended(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  Under-Oath Deposition & Cross-Examination Simulator
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80">
                  3-Round Witness Crucible
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auditing: <span className="text-slate-200 font-medium truncate max-w-sm inline-block align-bottom">"{note.title}"</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Persona Selector Bar */}
        <div className="p-3 bg-[#080C14] border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-500 mr-1">Opposing Counsel:</span>
            {personas.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (!isLoading && !currentQuestion && !depositionResult) {
                      setActivePersona(p.id);
                    }
                  }}
                  disabled={Boolean(currentQuestion || depositionResult || isLoading)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    activePersona === p.id
                      ? 'bg-slate-800 border-rose-700/80 text-rose-300 shadow-xs'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 opacity-75'
                  } disabled:cursor-not-allowed`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {depositionResult ? 'Hearing Concluded' : currentQuestion ? `Round ${round} of 3` : 'Ready for Sworn Testimony'}
            </span>
          </div>
        </div>

        {/* Hearing Chamber Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Unstarted Chamber */}
          {!currentQuestion && !depositionResult && !isLoading && (
            <div className="py-10 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
                <Gavel className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-slate-100">
                  Take the Stand: Defend Your Thesis Under Adversarial Cross-Examination
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {personas.find((p) => p.id === activePersona)?.attackVector}
                </p>
                <div className="pt-2 text-[11px] text-amber-400/90 font-mono flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Rules: 3 rapid-fire questions under oath. Zero polite fluff. Concludes with survival score and statutory safeguards.</span>
                </div>
              </div>

              <button
                onClick={handleStartHearing}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-700 via-indigo-700 to-rose-700 hover:opacity-90 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all"
              >
                <Gavel className="w-4 h-4" />
                <span>Begin 3-Round Deposition Hearing</span>
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-rose-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-200">
                {personas.find((p) => p.id === activePersona)?.name} is cross-examining your evidentiary chain...
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Evaluating admissibility standards, statutory precedents, and credibility traps.
              </p>
            </div>
          )}

          {/* Prior Interrogation Exchanges in Transcript */}
          {exchanges.length > 0 && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
                Official Deposition Record:
              </div>
              {exchanges.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-rose-400">
                    <span className="font-bold uppercase">Interrogation #{idx + 1} — Targeted Vulnerability: {item.target}</span>
                    <span className="text-slate-500">Recorded</span>
                  </div>
                  <p className="text-slate-200 font-medium">"{item.question}"</p>
                  <div className="pt-2 border-t border-slate-800/80 text-slate-300 text-[11px] italic bg-[#060910] p-2 rounded">
                    <strong className="text-cyan-400 font-sans not-italic">Witness Defense: </strong>
                    "{item.answer}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Question to Defend */}
          {currentQuestion && !isLoading && (
            <div className="p-4 bg-rose-950/30 border border-rose-800/80 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-rose-400 font-bold uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Targeted Epistemic Flaw: {targetVulnerability}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                  Under Oath · Round {round}/3
                </span>
              </div>

              <div className="text-sm font-semibold text-rose-100 leading-relaxed font-sans">
                "{currentQuestion}"
              </div>

              <form onSubmit={handleSubmitDefense} className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  value={witnessDefenseInput}
                  onChange={(e) => setWitnessDefenseInput(e.target.value)}
                  placeholder="Provide your precise evidentiary defense, citing statutory precedent, empirical methodology, or chain of custody safeguards..."
                  className="w-full bg-[#070A10] border border-rose-900/60 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 font-mono leading-relaxed resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Answer concisely before facing next challenge.
                  </span>
                  <button
                    type="submit"
                    disabled={!witnessDefenseInput.trim() || isLoading}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-colors"
                  >
                    <span>Submit Sworn Testimony</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Deposition Result Card */}
          {depositionResult && (
            <div className="space-y-4 animate-fadeIn">
              {/* Verdict Header Card */}
              <div className="p-4 bg-slate-900/90 border border-emerald-800/80 rounded-xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-300">
                        Cross-Examination Concluded & Verified
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {personas.find((p) => p.id === activePersona)?.name}'s Judicial Evaluation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-400">Survival Score</div>
                    <div className="text-lg font-mono font-bold text-emerald-400">
                      {depositionResult.survivalScore}%
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed italic">
                  "{depositionResult.witnessAssessment}"
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleAppendTranscript}
                    disabled={isTranscriptAppended}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isTranscriptAppended
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isTranscriptAppended ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Transcript Appended to Draft</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Append Full Hearing Transcript to Note</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleStartHearing}
                    className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Run Another Deposition</span>
                  </button>
                </div>
              </div>

              {/* Actionable Inoculation Safeguards with Explicit Copy & Insert buttons */}
              {depositionResult.defenseClauses && depositionResult.defenseClauses.length > 0 && (
                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Synthesized Defense Safeguards & Evidentiary Inoculations</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {depositionResult.defenseClauses.length} Clauses Generated
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Insert these protective evidentiary safeguards into your brief or thesis to prevent opposing counsel from impeaching your foundation:
                  </p>

                  <div className="space-y-3">
                    {depositionResult.defenseClauses.map((clause) => {
                      const isCopied = copiedClauseIds.has(clause.id);
                      const isInserted = insertedClauseIds.has(clause.id);

                      return (
                        <div
                          key={clause.id}
                          className="p-3 bg-slate-950 border border-emerald-900/40 rounded-lg space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-emerald-300 text-xs">
                              {clause.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {clause.statutoryBasisOrPrecedent}
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 font-mono leading-relaxed bg-[#050811] p-2.5 rounded border border-slate-900 select-text">
                            {clause.clauseText}
                          </p>

                          {/* Explicit Buttons: Copy Clause to Clipboard & Insert into Draft */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                            <button
                              onClick={() => handleCopyClause(clause)}
                              className={`py-1.5 px-3 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border ${
                                isCopied
                                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-slate-100 border-slate-800'
                              }`}
                              title="Copy this defense clause to clipboard"
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
                              onClick={() => handleInsertClauseIntoDraft(clause)}
                              disabled={isInserted}
                              className={`py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${
                                isInserted
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                              }`}
                              title="Insert this safeguard directly into the draft note"
                            >
                              {isInserted ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>✓ Inserted into Draft (+5 Resilience)</span>
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0A0E17] flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono text-slate-500">
            CogniVault Adversarial Crucible · Criminal Justice & Public Policy
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium ml-auto"
          >
            Close Hearing
          </button>
        </div>
      </div>
    </div>
  );
};
