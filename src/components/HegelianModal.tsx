import React, { useState } from 'react';
import { DocumentNote } from '../types';
import { GitMerge, Loader2, X, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface HegelianModalProps {
  notes: DocumentNote[];
  activeNoteId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreateSynthesisNote: (synthesisNote: DocumentNote) => void;
}

export const HegelianModal: React.FC<HegelianModalProps> = ({
  notes,
  activeNoteId,
  isOpen,
  onClose,
  onCreateSynthesisNote,
}) => {
  const [thesisId, setThesisId] = useState<string>(activeNoteId);
  const [antithesisId, setAntithesisId] = useState<string>(
    notes.find((n) => n.id !== activeNoteId)?.id || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesisId || !antithesisId || thesisId === antithesisId) {
      setErrorMsg('Please select two distinct contradictory theses to synthesize.');
      return;
    }

    const thesis = notes.find((n) => n.id === thesisId);
    const antithesis = notes.find((n) => n.id === antithesisId);
    if (!thesis || !antithesis) return;

    setIsLoading(true);
    setErrorMsg(null);

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

      if (!response.ok) {
        throw new Error(`Synthesis failed with status ${response.status}`);
      }

      const data = await response.json();

      const newSynthesisNote: DocumentNote = {
        id: `note-hegelian-${Date.now()}`,
        title: data.synthesisTitle || `Dialectical Synthesis: ${thesis.title.slice(0, 24)} & ${antithesis.title.slice(0, 24)}`,
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
            id: `pillar-thesis-${Date.now()}`,
            title: `Thesis: ${thesis.title}`,
            snippet: 'Foundational constituent paradigm incorporated into dialectical synthesis.',
            dateAdded: new Date().toISOString(),
          },
          {
            id: `pillar-anti-${Date.now()}`,
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

      onCreateSynthesisNote(newSynthesisNote);
      onClose();
    } catch (err: any) {
      console.error('Synthesis modal error:', err);
      setErrorMsg(err.message || 'Failed to generate Hegelian synthesis.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedThesis = notes.find((n) => n.id === thesisId);
  const selectedAntithesis = notes.find((n) => n.id === antithesisId);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0A0E17]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-600 to-rose-600 flex items-center justify-center text-white">
              <GitMerge className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Hegelian Dialectical Synthesis</h3>
              <p className="text-[11px] text-slate-400">Resolve two clashing paradigms into a higher-order framework</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSynthesize} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thesis Selection */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
              Thesis (Position A):
            </label>
            <select
              value={thesisId}
              onChange={(e) => setThesisId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {notes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.epistemicStatus})
                </option>
              ))}
            </select>
          </div>

          {/* Antithesis Selection */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
              Antithesis (Opposing Position B):
            </label>
            <select
              value={antithesisId}
              onChange={(e) => setAntithesisId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="">Select opposing thesis...</option>
              {notes
                .filter((n) => n.id !== thesisId)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.epistemicStatus})
                  </option>
                ))}
            </select>
          </div>

          {/* Dialectical Mechanics Preview */}
          {selectedThesis && selectedAntithesis && (
            <div className="p-3 bg-slate-950 rounded border border-slate-800/90 text-xs space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-indigo-400 block font-semibold">
                Dialectical Operation (Aufhebung):
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Gemini will transcend the binary opposition between <strong className="text-cyan-300">{selectedThesis.title}</strong> and <strong className="text-rose-300">{selectedAntithesis.title}</strong>, generating a unifying architecture that preserves the truth of both while eliminating their contradictions.
              </p>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !thesisId || !antithesisId || thesisId === antithesisId}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-rose-600 hover:opacity-95 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Dialectical Aufhebung...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Hegelian Synthesis Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
