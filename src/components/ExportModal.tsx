import React, { useState } from 'react';
import { DocumentNote } from '../types';
import {
  Share2,
  Download,
  Copy,
  Check,
  Upload,
  Database,
  X,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ExternalLink,
  Sparkles,
  CloudCheck,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { formatThesisForGoogleDocs, FormattedGoogleDoc } from '../utils/googleDocsFormatter';

interface ExportModalProps {
  note: DocumentNote;
  allNotes: DocumentNote[];
  isOpen: boolean;
  onClose: () => void;
  onImportNotes: (imported: DocumentNote[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  note,
  allNotes,
  isOpen,
  onClose,
  onImportNotes,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Google Workspace Integration State
  const [isGoogleDocsDrawerOpen, setIsGoogleDocsDrawerOpen] = useState(false);
  const [formattedDoc, setFormattedDoc] = useState<FormattedGoogleDoc | null>(null);
  const [copiedGoogleDoc, setCopiedGoogleDoc] = useState(false);
  const [workspaceSyncStatus, setWorkspaceSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate Epistemic Audit Header for Markdown
  const generateAuditedMarkdown = (n: DocumentNote): string => {
    const auditHeader = `<!-- ==========================================
     COGNIVAULT EPISTEMIC AUDIT REPORT
     ==========================================
     Epistemic Status: ${n.epistemicStatus.toUpperCase()}
     Argument Resilience Index: ${n.resilienceScore}%
     Falsifiability Criterion: ${n.falsifiabilityCriterion || 'NONE DECLARED (Speculative)'}
     Intellectual Domains: ${n.intellectualDomains.join(', ')}
     Supporting Pillars: ${n.supportingPillars.length}
     Documented Counter-Evidence: ${n.counterEvidence.length}
     Surviving Counter-Arguments Addressed: ${n.survivingCounterArguments.length}
     Remaining Untested Assumptions: ${n.untestedAssumptions.length}
     Audited Date: ${new Date().toISOString()}
     ========================================== -->

${n.content}

---

## Appendix: Epistemic Audit Details

### 1. Popperian Falsifiability Criterion
> ${n.falsifiabilityCriterion || 'No empirical condition has been defined to falsify this thesis.'}

### 2. Surviving Counter-Arguments Addressed
${n.survivingCounterArguments.length > 0 ? n.survivingCounterArguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n') : '*No adversarial rebuttals recorded.*'}

### 3. Declared Untested Assumptions
${n.untestedAssumptions.length > 0 ? n.untestedAssumptions.map((assum, i) => `- [ ] ${assum}`).join('\n') : '*No explicit assumptions declared.*'}

### 4. Empirical Evidence Ledger
- **Supporting Pillars (${n.supportingPillars.length})**: ${n.supportingPillars.map((p) => p.title).join('; ') || 'None'}
- **Opposing Counter-Evidence (${n.counterEvidence.length})**: ${n.counterEvidence.map((c) => c.title).join('; ') || 'None'}
`;

    return auditHeader;
  };

  const auditedContent = generateAuditedMarkdown(note);

  // Download active note with audit header
  const handleDownloadMarkdown = () => {
    const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'thesis'}-audited.md`;
    const blob = new Blob([auditedContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy audited markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(auditedContent);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  // Trigger Google Workspace Sync & Formatting
  const handleSyncGoogleDocs = () => {
    const doc = formatThesisForGoogleDocs(note);
    setFormattedDoc(doc);
    setIsGoogleDocsDrawerOpen(true);
    setWorkspaceSyncStatus('Thesis formatted into clean Google Docs structure with Epistemic Audit Header.');
  };

  // Copy rich formatted HTML/Text for pasting into Google Docs
  const handleCopyGoogleDocsRichText = async () => {
    const doc = formattedDoc || formatThesisForGoogleDocs(note);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([doc.html], { type: 'text/html' });
        const textBlob = new Blob([doc.plainText], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(doc.plainText);
      }
      setCopiedGoogleDoc(true);
      setWorkspaceSyncStatus('Copied rich formatted document to clipboard. Paste into Google Docs (Ctrl+V) with full layout and headers preserved.');
      setTimeout(() => setCopiedGoogleDoc(false), 3000);
    } catch (err) {
      // Fallback
      navigator.clipboard.writeText(doc.plainText);
      setCopiedGoogleDoc(true);
      setTimeout(() => setCopiedGoogleDoc(false), 3000);
    }
  };

  // Download Google Docs-compatible HTML file
  const handleDownloadGoogleDoc = () => {
    const doc = formattedDoc || formatThesisForGoogleDocs(note);
    const filename = `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'thesis'}-google-docs.html`;
    const blob = new Blob([doc.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setWorkspaceSyncStatus('Downloaded Google Docs-formatted file. You can open directly in Google Drive.');
  };

  // Export all notes as JSON
  const handleExportAllJSON = () => {
    const dataStr = JSON.stringify(allNotes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cognivault-adversarial-vault-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
          onImportNotes(parsed);
          setImportStatus(`Successfully restored ${parsed.length} audited research theses.`);
        } else {
          setImportStatus('Invalid JSON format. Expected an array of research notes.');
        }
      } catch (err) {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0A0E17]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Epistemic Audit &amp; Vault Export</h3>
              <p className="text-[11px] text-slate-400">Generate publishable, stress-tested research reports</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active Thesis Audit Card */}
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                {note.title}
              </span>
              <span className={`text-[11px] font-mono font-bold ${note.resilienceScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                Resilience: {note.resilienceScore}%
              </span>
            </div>

            {/* Audit Summary Mini-Card */}
            <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-400 tabular-nums">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-slate-200 uppercase font-sans font-semibold">{note.epistemicStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Falsifiability:</span>
                <span className={note.falsifiabilityCriterion ? 'text-emerald-400' : 'text-amber-400'}>
                  {note.falsifiabilityCriterion ? 'Articulated' : 'Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Surviving Rebuttals:</span>
                <span className="text-cyan-400">{note.survivingCounterArguments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Untested Assumptions:</span>
                <span className="text-amber-400">{note.untestedAssumptions.length}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Exports Markdown prepended with a verifiable Epistemic Audit Report detailing surviving counter-arguments and declared assumptions.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleDownloadMarkdown}
                className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Audited .md</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedMd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy with Audit Header</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ================= WORKSPACE EXPORT INTEGRATION ================= */}
          <div className="p-3.5 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-950 border border-blue-900/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-900/40 border border-blue-700/60 rounded text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>Google Workspace Export Integration</span>
                    <span className="px-1.5 py-0.2 bg-blue-950 border border-blue-800 text-[9px] font-mono text-blue-300 rounded">
                      Google Docs &amp; Drive
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Format this thesis with its full Epistemic Audit Header into a publication-grade document structure
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Action Button */}
            <button
              onClick={handleSyncGoogleDocs}
              className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sync to Google Drive / Docs</span>
            </button>

            {/* Structured Google Docs Drawer / Preview */}
            {isGoogleDocsDrawerOpen && (
              <div className="p-3 bg-slate-950/90 rounded-lg border border-blue-900/60 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-300">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Formatted Document Structure Ready</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    7 Sections Synced
                  </span>
                </div>

                {workspaceSyncStatus && (
                  <p className="text-[11px] text-blue-300 bg-blue-950/50 p-2 rounded border border-blue-800/60 leading-relaxed font-sans">
                    {workspaceSyncStatus}
                  </p>
                )}

                {/* Document Outline Preview */}
                <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    <span>Document Hierarchy &amp; Audit Header:</span>
                  </div>
                  {formattedDoc?.outline.map((sec, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-cyan-400 font-bold">{i + 1}.</span>
                      <span className="text-slate-200">{sec}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons for Google Docs / Drive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCopyGoogleDocsRichText}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedGoogleDoc ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Rich Layout!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy Rich Text for Docs</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadGoogleDoc}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download Google Doc (.html)</span>
                  </button>
                </div>

                {/* Quick Launcher for docs.new */}
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Open a new blank document to paste:</span>
                  <a
                    href="https://docs.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Launch Google Docs (docs.new)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Full Vault Backup */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Adversarial Archive ({allNotes.length} theses)</span>
            </div>
            <button
              onClick={handleExportAllJSON}
              className="w-full py-1.5 px-3 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 text-xs font-medium rounded border border-indigo-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download Vault JSON Archive</span>
            </button>
          </div>

          {/* Restore / Import */}
          <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Restore Vault Backup</span>
            <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-700 hover:border-slate-500 rounded cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Select JSON Backup File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            {importStatus && (
              <p className="text-[11px] text-cyan-400 text-center font-mono">{importStatus}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0A0E17] flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

