import React, { useEffect, useRef, useState } from 'react';
import { DocumentNote, SparringPersona, SparringMessage, DefenseClause } from '../types';
import { withSession } from '../lib/session';
import {
  Swords,
  Send,
  Loader2,
  X,
  PlusCircle,
  HelpCircle,
  Search,
  Sparkles,
  ChevronRight,
  BookmarkPlus,
  RefreshCw,
  Scale,
  Building2,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Timer,
  AlertTriangle,
  FileCheck,
  Check,
  Copy,
} from 'lucide-react';

interface AICopilotPanelProps {
  note: DocumentNote;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (updated: DocumentNote) => void;
  onOpenDepositionModal?: () => void;
}

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  note,
  isOpen,
  onClose,
  onUpdateNote,
  onOpenDepositionModal,
}) => {
  const [activePersona, setActivePersona] = useState<SparringPersona>('cross_examiner');
  const [messages, setMessages] = useState<SparringMessage[]>(() => note.session?.sparring?.cross_examiner ?? []);
  const noteRef = useRef(note);
  noteRef.current = note;
  const updateRef = useRef(onUpdateNote);
  updateRef.current = onUpdateNote;
  const skipSparPersist = useRef(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscoveringCounter, setIsDiscoveringCounter] = useState(false);
  const [discoveredCounters, setDiscoveredCounters] = useState<Array<{ title: string; snippet: string; url?: string }>>([]);
  const [adoptedClauseIds, setAdoptedClauseIds] = useState<Set<string>>(new Set());
  const [copiedClauseIds, setCopiedClauseIds] = useState<Set<string>>(new Set());

  // Copy defense clause to clipboard
  const handleCopyDefenseClause = (clause: DefenseClause) => {
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

  // Deposition / Mock Hearing Mode State
  const [isDepositionMode, setIsDepositionMode] = useState(false);
  const [depositionRound, setDepositionRound] = useState(1);
  const [depositionHistory, setDepositionHistory] = useState<Array<{ question: string; answer: string; target: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [targetVulnerability, setTargetVulnerability] = useState<string | null>(null);
  const [depositionResult, setDepositionResult] = useState<{
    survivalScore: number;
    witnessAssessment: string;
    defenseClauses?: DefenseClause[];
  } | null>(null);

  useEffect(() => {
    skipSparPersist.current = true;
    setMessages(note.session?.sparring?.[activePersona] ?? []);
  }, [note.id, activePersona]);

  useEffect(() => {
    if (skipSparPersist.current) {
      skipSparPersist.current = false;
      return;
    }
    const current = noteRef.current;
    updateRef.current(withSession(current, {
      sparring: { [activePersona]: messages },
    }));
  }, [messages, activePersona]);

  if (!isOpen) return null;

  const personas = [
    {
      id: 'cross_examiner' as SparringPersona,
      name: 'Cross-Examiner',
      subtitle: 'Hostile Counsel',
      icon: Scale,
      desc: 'Attacks chain of custody, cognitive bias, suggestive interviewing (Reid vs PEACE), and Daubert/Frye admissibility standards.',
      accent: 'text-rose-400 border-rose-800/80',
    },
    {
      id: 'bureaucratic_realist' as SparringPersona,
      name: 'Budget Director',
      subtitle: 'Bureaucratic Realist',
      icon: Building2,
      desc: 'Attacks unfunded mandates, Year 2/3 grant drop-offs, police/guard union friction, and street-level bureaucratic drift (Lipsky).',
      accent: 'text-amber-400 border-amber-800/80',
    },
    {
      id: 'empirical_criminologist' as SparringPersona,
      name: 'Criminologist',
      subtitle: 'Methodologist',
      icon: Gavel,
      desc: 'Dissects sampling bias, regression-to-the-mean, ecological fallacies in NIBRS/UCR data, and confounding variables.',
      accent: 'text-cyan-400 border-cyan-800/80',
    },
  ];

  // Send standard sparring turn
  const handleSendTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && messages.length > 0) return;

    const userText = inputMessage.trim() || 'Cross-examine my core thesis under Daubert and procedural standards.';
    setInputMessage('');

    const newHistory: SparringMessage[] = [
      ...messages,
      {
        id: `turn-${Date.now()}-user`,
        persona: activePersona,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/spar-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: activePersona,
          noteTitle: note.title,
          noteContent: note.content,
          userMessage: userText,
          history: newHistory.slice(-4),
          falsifiabilityCriterion: note.falsifiabilityCriterion,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sparring failed with status ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: SparringMessage = {
        id: `turn-${Date.now()}-assistant`,
        persona: activePersona,
        role: 'assistant',
        content: data.reply,
        critiquePillars: data.critiquePillars,
        suggestedFalsificationTest: data.suggestedFalsificationTest,
        epistemicFrictionDemand: data.epistemicFrictionDemand,
        defenseClauses: data.defenseClauses,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newHistory, assistantMsg]);

      // Adjust note resilience delta
      const updatedScore = Math.max(10, Math.min(100, note.resilienceScore + (data.resilienceDelta || 0)));
      onUpdateNote({
        ...note,
        resilienceScore: updatedScore,
        epistemicStatus: note.epistemicStatus === 'unchallenged' ? 'under_siege' : note.epistemicStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Sparring error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Deposition Mode
  const handleStartDeposition = async () => {
    setIsDepositionMode(true);
    setDepositionRound(1);
    setDepositionHistory([]);
    setDepositionResult(null);
    setIsLoading(true);

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

      if (!response.ok) throw new Error('Failed to start deposition');
      const data = await response.json();
      setCurrentQuestion(data.nextQuestion || 'State your evidentiary foundation under oath.');
      setTargetVulnerability(data.targetVulnerability || 'Procedural Foundation');
    } catch (e) {
      console.error('Deposition start error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Answer to Deposition Question
  const handleAnswerDeposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentQuestion) return;

    const answer = inputMessage.trim();
    setInputMessage('');

    const updatedExchanges = [
      ...depositionHistory,
      {
        question: currentQuestion,
        answer,
        target: targetVulnerability || 'Foundation',
      },
    ];
    setDepositionHistory(updatedExchanges);

    const nextRound = depositionRound + 1;
    setDepositionRound(nextRound);
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

      if (!response.ok) throw new Error('Failed to process deposition turn');
      const data = await response.json();

      if (data.isFinal || nextRound > 3) {
        setDepositionResult({
          survivalScore: data.survivalScore,
          witnessAssessment: data.witnessAssessment,
          defenseClauses: data.defenseClauses,
        });
        setCurrentQuestion(null);

        // Update note resilience
        onUpdateNote({
          ...note,
          resilienceScore: Math.round((note.resilienceScore + data.survivalScore) / 2),
          survivingCounterArguments: [
            ...note.survivingCounterArguments,
            `Deposition Survived (${data.survivalScore}%): ${data.witnessAssessment.slice(0, 80)}...`,
          ],
          updatedAt: new Date().toISOString(),
        });
      } else {
        setCurrentQuestion(data.nextQuestion);
        setTargetVulnerability(data.targetVulnerability);
      }
    } catch (e) {
      console.error('Deposition question error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Adopt Actionable Defense Clause into active note
  const handleAdoptDefenseClause = (clause: DefenseClause) => {
    const formatted = `\n\n### Inoculation Defense Clause: ${clause.title}\n> **Statutory/Precedent Authority:** ${clause.statutoryBasisOrPrecedent}\n\n${clause.clauseText}\n`;

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

    setAdoptedClauseIds((prev) => new Set(prev).add(clause.id));
  };

  // Discover opposing literature & counter-evidence
  const handleDiscoverCounterEvidence = async () => {
    setIsDiscoveringCounter(true);
    setDiscoveredCounters([]);
    try {
      const response = await fetch('/api/gemini/counter-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          intellectualDomains: note.intellectualDomains,
        }),
      });

      if (!response.ok) throw new Error('Failed to discover counter-evidence');
      const data = await response.json();
      setDiscoveredCounters(data.counterItems || []);
    } catch (e) {
      console.error('Counter evidence error:', e);
    } finally {
      setIsDiscoveringCounter(false);
    }
  };

  // Attach discovered counter-evidence into note
  const handleAttachCounterEvidence = (item: { title: string; snippet: string; url?: string }) => {
    const newCite = {
      id: `cite-counter-${Date.now()}`,
      title: item.title,
      snippet: item.snippet,
      url: item.url,
      dateAdded: new Date().toISOString(),
    };

    onUpdateNote({
      ...note,
      counterEvidence: [...note.counterEvidence, newCite],
      updatedAt: new Date().toISOString(),
    });

    setDiscoveredCounters((prev) => prev.filter((i) => i.title !== item.title));
  };

  // Append standard debate synthesis to note
  const handleAppendDebateToNote = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;

    const formatted = `\n\n## Adversarial Cross-Examination (${personas.find((p) => p.id === activePersona)?.name})\n> ${lastAssistant.content.replace(/\n/g, '\n> ')}\n\n### Surviving Counter-Pillars Addressed:\n${(lastAssistant.critiquePillars || []).map((p) => `- ${p}`).join('\n')}\n`;

    onUpdateNote({
      ...note,
      content: note.content + formatted,
      survivingCounterArguments: [
        ...note.survivingCounterArguments,
        ...(lastAssistant.critiquePillars || []),
      ],
      updatedAt: new Date().toISOString(),
    });
  };

  // Append deposition transcript to note
  const handleAppendDepositionToNote = () => {
    if (!depositionResult) return;

    const transcript = `\n\n## Expert Witness Deposition Record (${personas.find((p) => p.id === activePersona)?.name})\n**Cross-Examination Survival Score:** ${depositionResult.survivalScore}%\n\n> **Inquisitor Verdict:** ${depositionResult.witnessAssessment}\n\n### Interrogation Exchanges:\n${depositionHistory.map((h, i) => `**Q${i + 1} (${h.target}):** ${h.question}\n*Witness Answer:* ${h.answer}`).join('\n\n')}\n`;

    onUpdateNote({
      ...note,
      content: note.content + transcript,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <aside className="fixed lg:relative inset-y-0 right-0 z-40 lg:z-auto w-full sm:w-[430px] max-w-[90vw] border-l border-slate-800/80 bg-[#0B0F19] flex flex-col shrink-0 h-full overflow-hidden select-none shadow-2xl lg:shadow-none animate-slideIn">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-[#0A0E17]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-100">
              {isDepositionMode ? 'Courtroom Deposition Hearing' : 'Adversarial Crucible Arena'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {isDepositionMode ? 'Timed Witness Stress Test' : 'Zero Sycophancy · Actionable Inoculation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isDepositionMode ? (
            <button
              onClick={() => setIsDepositionMode(false)}
              className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              Exit Hearing
            </button>
          ) : (
            <button
              onClick={() => setMessages([])}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors text-[11px]"
              title="Reset cross-examination history"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Close sparring arena"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selectable Retuned Criminal Justice & Policy Personas */}
      <div className="p-2 border-b border-slate-800/80 bg-[#090D16]">
        <div className="grid grid-cols-3 gap-1">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePersona(p.id);
                  if (isDepositionMode) setIsDepositionMode(false);
                }}
                className={`p-1.5 rounded text-left transition-all border ${
                  activePersona === p.id
                    ? 'bg-slate-800/90 border-slate-600 shadow-sm'
                    : 'border-transparent hover:bg-slate-800/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className={`text-[11px] font-semibold flex items-center gap-1 ${p.accent.split(' ')[0]}`}>
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </div>
                <div className="text-[9px] text-slate-400 truncate">{p.subtitle}</div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 italic mt-1.5 px-1 leading-snug">
          {personas.find((p) => p.id === activePersona)?.desc}
        </p>

        {/* Deposition Mode Trigger Button */}
        {!isDepositionMode && (
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => {
                if (onOpenDepositionModal) {
                  onOpenDepositionModal();
                } else {
                  handleStartDeposition();
                }
              }}
              className="w-full py-1.5 px-2.5 bg-gradient-to-r from-rose-950 via-indigo-950 to-slate-900 hover:opacity-90 border border-rose-800/60 rounded-lg text-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Gavel className="w-3.5 h-3.5 text-rose-400" />
              <span>Enter 3-Minute Deposition Stress-Test</span>
            </button>
          </div>
        )}
      </div>

      {/* Evidence Scout Bar (in normal mode) */}
      {!isDepositionMode && (
        <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
            <Search className="w-3 h-3 text-cyan-400" />
            <span>Empirical Counter-Evidence Scout</span>
          </span>
          <button
            onClick={handleDiscoverCounterEvidence}
            disabled={isDiscoveringCounter}
            className="text-cyan-400 hover:text-cyan-300 text-[10px] font-mono flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            {isDiscoveringCounter ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            <span>Scout Studies</span>
          </button>
        </div>
      )}

      {/* Discovered Counter-evidence items */}
      {!isDepositionMode && discoveredCounters.length > 0 && (
        <div className="p-2.5 bg-rose-950/20 border-b border-rose-900/40 space-y-2 max-h-48 overflow-y-auto">
          <span className="text-[10px] uppercase font-mono text-rose-400 font-bold block">
            Opposing Studies & Court Decisions:
          </span>
          {discoveredCounters.map((item, idx) => (
            <div key={idx} className="p-2 bg-slate-900/90 border border-slate-800 rounded text-xs space-y-1">
              <div className="font-semibold text-slate-200 text-[11px]">{item.title}</div>
              <p className="text-[10px] text-slate-400 italic">"{item.snippet}"</p>
              <button
                onClick={() => handleAttachCounterEvidence(item)}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 pt-1"
              >
                <BookmarkPlus className="w-3 h-3" />
                <span>Attach to Counter-Evidence</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* BODY VIEW: DEPOSITION MODE VS. REGULAR SPARRING */}
      {isDepositionMode ? (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#080C14]">
          {/* Hearing Status Indicator */}
          <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="font-semibold text-slate-200">
                {depositionResult ? 'Deposition Concluded' : `Cross-Examination: Round ${depositionRound}/3`}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Inquisitor: {personas.find((p) => p.id === activePersona)?.name}
            </span>
          </div>

          {/* Past Exchanges */}
          {depositionHistory.map((h, i) => (
            <div key={i} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs space-y-1.5">
              <div className="font-mono text-[10px] text-rose-400 uppercase font-semibold">
                Question {i + 1} ({h.target})
              </div>
              <p className="text-slate-200 font-medium">"{h.question}"</p>
              <div className="pt-1 border-t border-slate-800/80 text-slate-400 text-[11px] italic">
                <strong>Witness Testimony:</strong> "{h.answer}"
              </div>
            </div>
          ))}

          {/* Active Question to Answer */}
          {currentQuestion && (
            <div className="p-3 bg-rose-950/20 border border-rose-800/60 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-rose-400 font-bold uppercase">
                  Targeted Flaw: {targetVulnerability}
                </span>
                <span className="text-slate-500">Under Oath</span>
              </div>
              <p className="text-xs text-rose-100 font-semibold leading-relaxed">
                "{currentQuestion}"
              </p>
            </div>
          )}

          {/* Final Deposition Verdict Card */}
          {depositionResult && (
            <div className="p-4 bg-slate-900/90 border border-emerald-800/80 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Deposition Survival Verdict</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Survival Score: {depositionResult.survivalScore}%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/60 p-2.5 rounded border border-slate-800">
                "{depositionResult.witnessAssessment}"
              </p>

              {/* Actionable Defense Clauses from Deposition */}
              {depositionResult.defenseClauses && depositionResult.defenseClauses.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                    Actionable Inoculation Safeguards:
                  </span>
                  {depositionResult.defenseClauses.map((clause) => (
                    <div key={clause.id} className="p-2.5 bg-slate-950 border border-emerald-900/40 rounded text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-300 text-[11px]">{clause.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{clause.statutoryBasisOrPrecedent}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-[#060910] p-2 rounded">
                        {clause.clauseText}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-900">
                        <button
                          onClick={() => handleCopyDefenseClause(clause)}
                          className={`text-[10px] font-medium py-1 px-2 rounded flex items-center gap-1 transition-colors border ${
                            copiedClauseIds.has(clause.id)
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                          title="Copy safeguard clause to clipboard"
                        >
                          {copiedClauseIds.has(clause.id) ? (
                            <>
                              <Check className="w-3 h-3 text-cyan-400" />
                              <span>✓ Copied to Clipboard</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy Clause to Clipboard</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAdoptDefenseClause(clause)}
                          disabled={adoptedClauseIds.has(clause.id)}
                          className={`text-[10px] font-semibold py-1 px-2.5 rounded flex items-center gap-1 transition-colors ${
                            adoptedClauseIds.has(clause.id)
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                          title="Insert safeguard into draft thesis"
                        >
                          {adoptedClauseIds.has(clause.id) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>✓ Inserted into Draft</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3" />
                              <span>Insert into Draft</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAppendDepositionToNote}
                className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Append Deposition Transcript to Draft</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="py-4 text-center text-xs text-rose-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Formulating cross-examination interrogation...</span>
            </div>
          )}
        </div>
      ) : (
        /* Regular Sparring Thread */
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {messages.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Scale className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Courtroom Uncontested</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Enter your thesis defense or hit "Commence Cross-Examination" to have {personas.find((p) => p.id === activePersona)?.name} deconstruct your evidentiary chain of custody with zero polite padding.
                </p>
              </div>
              <button
                onClick={() => handleSendTurn()}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 shadow-md shadow-rose-950/50"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Commence Cross-Examination</span>
              </button>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-xs leading-relaxed space-y-2.5 border ${
                  msg.role === 'user'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                    : 'bg-[#070A10] border-rose-900/40 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={msg.role === 'user' ? 'text-cyan-400' : 'text-rose-400 font-bold uppercase'}>
                    {msg.role === 'user' ? 'Witness Testimony' : personas.find((p) => p.id === msg.persona)?.name}
                  </span>
                  <span className="text-slate-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Epistemic Friction Demand Banner */}
                {msg.epistemicFrictionDemand && (
                  <div className="p-2.5 bg-amber-950/30 border border-amber-800/50 rounded-lg text-[11px] text-amber-200 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Epistemic Friction: Falsification Demand</span>
                    </span>
                    <p className="leading-snug italic font-mono text-[10px]">
                      "{msg.epistemicFrictionDemand}"
                    </p>
                  </div>
                )}

                {/* Critique Pillars */}
                {msg.critiquePillars && msg.critiquePillars.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold block">
                      Legal & Methodological Vulnerabilities:
                    </span>
                    {msg.critiquePillars.map((p, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actionable Defense Inoculation Clauses Card */}
                {msg.defenseClauses && msg.defenseClauses.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Actionable Inoculation Safeguards:</span>
                    </span>

                    {msg.defenseClauses.map((clause) => (
                      <div
                        key={clause.id}
                        className="p-2.5 bg-slate-950/90 border border-emerald-900/50 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-300 text-[11px]">{clause.title}</span>
                          <span className="text-[10px] font-mono text-slate-500">{clause.statutoryBasisOrPrecedent}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-mono leading-relaxed bg-[#050810] p-2 rounded border border-slate-900">
                          {clause.clauseText}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-900">
                          <button
                            onClick={() => handleCopyDefenseClause(clause)}
                            className={`text-[10px] font-medium py-1 px-2 rounded flex items-center gap-1 transition-colors border ${
                              copiedClauseIds.has(clause.id)
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                            }`}
                            title="Copy safeguard clause to clipboard"
                          >
                            {copiedClauseIds.has(clause.id) ? (
                              <>
                                <Check className="w-3 h-3 text-cyan-400" />
                                <span>✓ Copied to Clipboard</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy Clause to Clipboard</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleAdoptDefenseClause(clause)}
                            disabled={adoptedClauseIds.has(clause.id)}
                            className={`text-[10px] font-semibold py-1 px-2.5 rounded flex items-center gap-1 transition-colors ${
                              adoptedClauseIds.has(clause.id)
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            }`}
                            title="Insert safeguard into draft thesis"
                          >
                            {adoptedClauseIds.has(clause.id) ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>✓ Inserted into Draft</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3 h-3" />
                                <span>Insert into Draft</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.suggestedFalsificationTest && (
                  <div className="p-2 bg-indigo-950/30 border border-indigo-800/40 rounded text-[11px] text-indigo-200">
                    <span className="font-semibold block text-[10px] uppercase text-indigo-400 mb-0.5">
                      Proposed Daubert / Empirical Benchmark:
                    </span>
                    {msg.suggestedFalsificationTest}
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-rose-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing cross-examination response...</span>
            </div>
          )}
        </div>
      )}

      {/* Debate Action Affordance */}
      {!isDepositionMode && messages.some((m) => m.role === 'assistant') && (
        <div className="p-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[10px] font-mono text-slate-500">
            Survived rounds: {messages.filter((m) => m.role === 'assistant').length}
          </span>
          <button
            onClick={handleAppendDebateToNote}
            className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Append Defense into Draft</span>
          </button>
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={isDepositionMode ? handleAnswerDeposition : handleSendTurn}
        className="p-3 border-t border-slate-800 bg-[#0A0E17] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={
            isDepositionMode
              ? 'Enter concise witness testimony defense...'
              : 'Defend your evidentiary claim against this critique...'
          }
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading || (isDepositionMode && Boolean(depositionResult))}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim() || (isDepositionMode && Boolean(depositionResult))}
          className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors disabled:opacity-50"
          title="Submit testimony"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
