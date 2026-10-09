import React, { useState, useEffect } from 'react';
import { DocumentNote, CitationSource } from '../types';
import {
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Sparkles,
  Loader2,
  ArrowDownCircle,
  Database,
  RotateCcw,
} from 'lucide-react';
import {
  parseBibTeX,
  isBibTeX,
  isDOI,
  extractDOI,
  resolveDOI,
  SAMPLE_CITATIONS,
  ParsedCitation,
} from '../utils/bibtexParser';

interface CitationsModalProps {
  note: DocumentNote;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (updated: DocumentNote) => void;
}

export const CitationsModal: React.FC<CitationsModalProps> = ({
  note,
  isOpen,
  onClose,
  onUpdateNote,
}) => {
  const [activeTab, setActiveTab] = useState<'supporting' | 'counter'>('supporting');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [snippet, setSnippet] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // BibTeX / DOI Importer state
  const [rawInput, setRawInput] = useState('');
  const [parsedCitation, setParsedCitation] = useState<ParsedCitation | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<'bibtex' | 'doi' | 'unrecognized' | null>(null);

  // Live parse whenever rawInput changes
  useEffect(() => {
    const text = rawInput.trim();
    if (!text) {
      setParsedCitation(null);
      setDetectedFormat(null);
      return;
    }

    if (isBibTeX(text)) {
      setDetectedFormat('bibtex');
      const parsed = parseBibTeX(text);
      setParsedCitation(parsed);
    } else if (isDOI(text)) {
      setDetectedFormat('doi');
      const cleanDoi = extractDOI(text);
      if (cleanDoi) {
        setIsResolving(true);
        resolveDOI(cleanDoi).then((res) => {
          setParsedCitation(res);
          setIsResolving(false);
        }).catch(() => {
          setIsResolving(false);
        });
      }
    } else {
      setDetectedFormat('unrecognized');
      setParsedCitation(null);
    }
  }, [rawInput]);

  if (!isOpen) return null;

  // Auto-populate form fields from parsed citation
  const handlePopulateFormFields = () => {
    if (!parsedCitation) return;
    setTitle(parsedCitation.title);
    setUrl(parsedCitation.url || (parsedCitation.doi ? `https://doi.org/${parsedCitation.doi}` : ''));
    setSnippet(parsedCitation.snippet);
    setImportStatusMessage('Populated form fields below. Review and click "Add".');
    setTimeout(() => setImportStatusMessage(null), 3500);
  };

  // Direct 1-click import into Supporting or Counter list
  const handleDirectImport = (target: 'supporting' | 'counter') => {
    if (!parsedCitation) return;

    const newCitation: CitationSource = {
      id: `cite-${target}-${Date.now()}`,
      title: parsedCitation.title,
      url: parsedCitation.url || (parsedCitation.doi ? `https://doi.org/${parsedCitation.doi}` : undefined),
      snippet: parsedCitation.snippet,
      dateAdded: new Date().toISOString(),
    };

    if (target === 'supporting') {
      onUpdateNote({
        ...note,
        supportingPillars: [...note.supportingPillars, newCitation],
        updatedAt: new Date().toISOString(),
      });
      setImportStatusMessage(`Imported "${parsedCitation.title.slice(0, 45)}..." directly into Supporting Pillars.`);
    } else {
      onUpdateNote({
        ...note,
        counterEvidence: [...note.counterEvidence, newCitation],
        updatedAt: new Date().toISOString(),
      });
      setImportStatusMessage(`Imported "${parsedCitation.title.slice(0, 45)}..." directly into Counter-Evidence.`);
    }

    setActiveTab(target);
    setRawInput('');
    setParsedCitation(null);
    setTimeout(() => setImportStatusMessage(null), 4000);
  };

  const handleAddCitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCitation: CitationSource = {
      id: `cite-${activeTab}-${Date.now()}`,
      title: title.trim(),
      url: url.trim() || undefined,
      snippet: snippet.trim(),
      dateAdded: new Date().toISOString(),
    };

    if (activeTab === 'supporting') {
      onUpdateNote({
        ...note,
        supportingPillars: [...note.supportingPillars, newCitation],
        updatedAt: new Date().toISOString(),
      });
    } else {
      onUpdateNote({
        ...note,
        counterEvidence: [...note.counterEvidence, newCitation],
        updatedAt: new Date().toISOString(),
      });
    }

    setTitle('');
    setUrl('');
    setSnippet('');
  };

  const handleDeleteCitation = (id: string, isSupporting: boolean) => {
    if (isSupporting) {
      onUpdateNote({
        ...note,
        supportingPillars: note.supportingPillars.filter((c) => c.id !== id),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onUpdateNote({
        ...note,
        counterEvidence: note.counterEvidence.filter((c) => c.id !== id),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleCopyTag = (index: number, isSupporting: boolean) => {
    const tag = isSupporting ? `[Pillar ${index + 1}]` : `[Counter ${index + 1}]`;
    navigator.clipboard.writeText(tag);
    setCopiedId(tag);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const currentList = activeTab === 'supporting' ? note.supportingPillars : note.counterEvidence;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0A0E17]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Bifurcated Empirical Evidence Vault</h3>
              <p className="text-[11px] text-slate-400">Supporting Pillars vs. Opposing Counter-Evidence for "{note.title}"</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-[#090D16]">
          <button
            onClick={() => setActiveTab('supporting')}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'supporting'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supporting Pillars ({note.supportingPillars.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'counter'
                ? 'border-rose-500 text-rose-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Counter-Evidence ({note.counterEvidence.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status Message Notification */}
          {importStatusMessage && (
            <div className="p-3 bg-cyan-950/80 border border-cyan-800/80 rounded-lg flex items-center justify-between text-xs text-cyan-200 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{importStatusMessage}</span>
              </div>
              <button
                onClick={() => setImportStatusMessage(null)}
                className="text-cyan-400 hover:text-cyan-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* BibTeX / DOI Auto-Importer Card */}
          <div className="p-3.5 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-lg space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-950/70 border border-cyan-800/60 rounded text-cyan-400">
                  <FileCode className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">BibTeX / DOI Academic Importer</h4>
                  <p className="text-[10px] text-slate-400">
                    Paste raw BibTeX or digital object identifiers to auto-populate evidence fields
                  </p>
                </div>
              </div>

              {/* Sample preset buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">Presets:</span>
                <button
                  type="button"
                  onClick={() => setRawInput(SAMPLE_CITATIONS.eyewitnessBibTeX)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 transition-colors"
                  title="Load Loftus & Wells Eyewitness BibTeX"
                >
                  Eyewitness BibTeX
                </button>
                <button
                  type="button"
                  onClick={() => setRawInput(SAMPLE_CITATIONS.compasBibTeX)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 transition-colors"
                  title="Load COMPAS Machine Bias BibTeX"
                >
                  COMPAS BibTeX
                </button>
                <button
                  type="button"
                  onClick={() => setRawInput(SAMPLE_CITATIONS.netWideningDoi)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 transition-colors"
                  title="Load Net-Widening DOI"
                >
                  Net-Widening DOI
                </button>
              </div>
            </div>

            {/* Input area */}
            <div className="relative">
              <textarea
                rows={rawInput.includes('@') ? 4 : 2}
                placeholder="Paste BibTeX snippet (e.g. @article{loftus1979...}) or DOI (e.g. 10.1111/crim.12053 or https://doi.org/...)"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500 transition-all leading-relaxed"
              />
              {rawInput && (
                <button
                  type="button"
                  onClick={() => {
                    setRawInput('');
                    setParsedCitation(null);
                  }}
                  className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-300 rounded"
                  title="Clear snippet"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Parser Status & Parsed Preview */}
            {isResolving && (
              <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded border border-slate-800 text-[11px] text-cyan-400 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Resolving DOI metadata from scholarly index...</span>
              </div>
            )}

            {parsedCitation && (
              <div className="p-3 bg-slate-950 border border-cyan-900/60 rounded-lg space-y-2.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono rounded uppercase">
                        {detectedFormat === 'bibtex' ? 'BibTeX Extracted' : 'DOI Resolved'}
                      </span>
                      {parsedCitation.year && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {parsedCitation.year}
                        </span>
                      )}
                      {parsedCitation.journal && (
                        <span className="text-[10px] text-slate-400 italic truncate max-w-xs">
                          {parsedCitation.journal}
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-slate-100 leading-snug">
                      {parsedCitation.title}
                    </h5>
                    {parsedCitation.author && (
                      <p className="text-[11px] text-slate-400">
                        {parsedCitation.author}
                      </p>
                    )}
                  </div>
                </div>

                {parsedCitation.snippet && (
                  <p className="text-[11px] text-slate-300 italic bg-slate-900/70 p-2 rounded border border-slate-800 leading-relaxed">
                    "{parsedCitation.snippet}"
                  </p>
                )}

                {/* Import actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handlePopulateFormFields}
                    className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Populate Form Fields</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectImport('supporting')}
                      className="py-1 px-2.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-[11px] font-medium rounded border border-cyan-800 flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Import into Supporting Pillars</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectImport('counter')}
                      className="py-1 px-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 text-[11px] font-medium rounded border border-rose-800 flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Import into Counter-Evidence</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Evidence Form */}
          <form onSubmit={handleAddCitation} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">
              {activeTab === 'supporting' ? 'Attach Validating Pillar' : 'Attach Opposing Study / Anomaly'}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Source Title / Paper Name</label>
                <input
                  type="text"
                  placeholder="e.g. Empirical trial on surface code threshold..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">URL or DOI (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Explanatory Snippet / Data Anomaly</label>
              <textarea
                rows={2}
                placeholder="Key empirical finding or contradiction snippet..."
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className={`px-3 py-1.5 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === 'supporting'
                    ? 'bg-cyan-600 hover:bg-cyan-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {activeTab === 'supporting' ? 'Pillar' : 'Counter-Evidence'}</span>
              </button>
            </div>
          </form>

          {/* List of Evidence */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Documented {activeTab === 'supporting' ? 'Pillars' : 'Counter-Evidence'} ({currentList.length})
            </span>

            {currentList.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/30 rounded-lg border border-dashed border-slate-800">
                {activeTab === 'supporting'
                  ? 'No supporting pillars attached yet.'
                  : 'Zero counter-evidence documented. A thesis without counter-evidence cannot graduate to Resilient!'}
              </div>
            ) : (
              currentList.map((cite, idx) => (
                <div
                  key={cite.id}
                  className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono tabular-nums font-bold shrink-0 ${activeTab === 'supporting' ? 'text-cyan-400' : 'text-rose-400'}`}>
                        [{activeTab === 'supporting' ? 'Pillar' : 'Counter'} {idx + 1}]
                      </span>
                      <h5 className="text-xs font-semibold text-slate-200 truncate">{cite.title}</h5>
                      {cite.url && (
                        <a href={cite.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-cyan-400 shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {cite.snippet && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2 rounded border border-slate-800/80 leading-relaxed">
                        "{cite.snippet}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-500">
                      <span>Added {new Date(cite.dateAdded).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleCopyTag(idx, activeTab === 'supporting')}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
                      >
                        {copiedId === `[${activeTab === 'supporting' ? 'Pillar' : 'Counter'} ${idx + 1}]` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied tag</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy tag</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCitation(cite.id, activeTab === 'supporting')}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Delete evidence"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0A0E17] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
