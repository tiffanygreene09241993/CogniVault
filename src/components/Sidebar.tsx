import React, { useState, useMemo } from 'react';
import { DocumentNote, EpistemicStatus } from '../types';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  FolderOpen,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Swords,
  GitMerge,
  AlertTriangle,
  X,
} from 'lucide-react';

interface SidebarProps {
  notes: DocumentNote[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onDeleteNote: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onOpenHegelianModal: () => void;
  onCloseSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onDeleteNote,
  onDuplicateNote,
  onOpenHegelianModal,
  onCloseSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EpistemicStatus | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Extract unique intellectual domains
  const allDomains = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.intellectualDomains?.forEach((d) => set.add(d)));
    return Array.from(set);
  }, [notes]);

  // Filter notes by search, epistemic status, and domain
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.intellectualDomains.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || n.epistemicStatus === statusFilter;
      const matchesDomain = !selectedDomain || n.intellectualDomains.includes(selectedDomain);

      return matchesSearch && matchesStatus && matchesDomain;
    });
  }, [notes, searchQuery, statusFilter, selectedDomain]);

  // Counts for each epistemic queue
  const statusCounts = useMemo(() => {
    return {
      all: notes.length,
      unchallenged: notes.filter((n) => n.epistemicStatus === 'unchallenged').length,
      under_siege: notes.filter((n) => n.epistemicStatus === 'under_siege').length,
      resilient: notes.filter((n) => n.epistemicStatus === 'resilient').length,
    };
  }, [notes]);

  return (
    <aside className="fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-[290px] lg:w-[320px] max-w-[85vw] border-r border-slate-800/80 bg-[#0B0F19] flex flex-col shrink-0 h-full overflow-hidden select-none shadow-2xl md:shadow-none animate-slideIn">
      {/* Top Header & Search */}
      <div className="p-3.5 border-b border-slate-800/80 flex flex-col gap-2.5 bg-[#0A0E17]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-rose-500" />
            <span>Epistemic Triage Queue</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {notes.length} theses
            </span>
            {onCloseSidebar && (
              <button
                onClick={onCloseSidebar}
                className="md:hidden p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                title="Collapse sidebar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search theses, domains, premises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800/90 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Epistemic Status Queues (Functional Filter Buttons) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/80 border border-slate-800/90 rounded-lg text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1 text-center font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('unchallenged')}
            className={`py-1 text-center font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'unchallenged'
                ? 'bg-slate-800 text-slate-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Fragile unverified drafts with 0 sparring rounds"
          >
            Unch. ({statusCounts.unchallenged})
          </button>
          <button
            onClick={() => setStatusFilter('under_siege')}
            className={`py-1 text-center font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'under_siege'
                ? 'bg-rose-950/60 text-rose-300 shadow-sm'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
            title="Heavily contested with active adversarial challenges"
          >
            Siege ({statusCounts.under_siege})
          </button>
          <button
            onClick={() => setStatusFilter('resilient')}
            className={`py-1 text-center font-medium rounded transition-colors whitespace-nowrap ${
              statusFilter === 'resilient'
                ? 'bg-emerald-950/60 text-emerald-300 shadow-sm'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
            title="Battle-tested with surviving counter-arguments and falsifiability criteria"
          >
            Resil. ({statusCounts.resilient})
          </button>
        </div>

        {/* Intellectual Domain Filters */}
        {allDomains.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
            <button
              onClick={() => setSelectedDomain(null)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                selectedDomain === null
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Domains
            </button>
            {allDomains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors whitespace-nowrap shrink-0 ${
                  selectedDomain === domain
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                #{domain}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
            <p>No theses found in this epistemic state</p>
            {(searchQuery || statusFilter !== 'all' || selectedDomain) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSelectedDomain(null);
                }}
                className="text-rose-400 hover:underline text-[11px]"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = note.id === activeNoteId;
            const openLints = note.logicLintIssues?.length || 0;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-2.5 rounded-lg cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-900 border-slate-700/80 shadow-sm'
                    : 'border-transparent hover:bg-slate-900/50 hover:border-slate-800/60'
                }`}
              >
                {/* Note Title & Epistemic Icon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <span className="mt-0.5 shrink-0">
                      {note.epistemicStatus === 'resilient' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : note.epistemicStatus === 'under_siege' ? (
                        <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </span>
                    <h4
                      className={`text-xs font-semibold leading-snug line-clamp-2 ${
                        isActive ? 'text-slate-100' : 'text-slate-300 group-hover:text-slate-100'
                      }`}
                    >
                      {note.title || 'Untitled Thesis'}
                    </h4>
                  </div>

                  {/* Actions on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateNote(note.id);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                      title="Duplicate thesis"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {notes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete thesis"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Excerpt */}
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-normal">
                  {note.content.replace(/^#+\s+/gm, '').replace(/\n+/g, ' ').slice(0, 95) || 'No premise drafted...'}
                </p>

                {/* ZERO-PILL EPISTEMIC METADATA */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-mono tabular-nums">
                  <span className={note.resilienceScore >= 75 ? 'text-emerald-400 font-bold' : note.resilienceScore >= 50 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                    Resil: {note.resilienceScore}%
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span>{note.supportingPillars.length} pillars</span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className={note.counterEvidence.length > 0 ? 'text-rose-400' : 'text-slate-500'}>
                    {note.counterEvidence.length} counter
                  </span>

                  {openLints > 0 && (
                    <>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{openLints} flaws</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Intellectual Domains list */}
                {note.intellectualDomains.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mt-1 truncate">
                    {note.intellectualDomains.slice(0, 2).map((d) => (
                      <span key={d}>#{d}</span>
                    ))}
                    {note.intellectualDomains.length > 2 && (
                      <span>+{note.intellectualDomains.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky Action Bar: New Thesis & Hegelian Synthesis */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0A0E17] flex items-center gap-2">
        <button
          onClick={onNewNote}
          className="flex-1 py-1.5 px-3 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-rose-400" />
          <span>New Thesis</span>
        </button>

        <button
          onClick={onOpenHegelianModal}
          className="py-1.5 px-2.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition-colors flex items-center gap-1"
          title="Spawn Hegelian Synthesis (Thesis + Antithesis -> Synthesis)"
        >
          <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] hidden sm:inline">Synthesize</span>
        </button>
      </div>
    </aside>
  );
};
