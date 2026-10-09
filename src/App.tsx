/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DocumentNote, ViewMode, SparringPersona } from './types';
import { INITIAL_NOTES } from './data/initialNotes';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { AICopilotPanel } from './components/AICopilotPanel';
import { GraphView } from './components/GraphView';
import { CitationsModal } from './components/CitationsModal';
import { ExportModal } from './components/ExportModal';
import { HegelianModal } from './components/HegelianModal';
import { PreMortemModal } from './components/PreMortemModal';
import { DepositionModal } from './components/DepositionModal';

const STORAGE_KEY = 'cognivault_adversarial_notes_v4';

export default function App() {
  // Load notes from localStorage or fallback to INITIAL_NOTES
  const [notes, setNotes] = useState<DocumentNote[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].supportingPillars) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read notes from localStorage:', e);
    }
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || 'note-eyewitness-contamination';
  });

  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<SparringPersona>('cross_examiner');

  // Modals state (closed by default)
  const [isCitationsModalOpen, setIsCitationsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHegelianModalOpen, setIsHegelianModalOpen] = useState(false);
  const [isPreMortemModalOpen, setIsPreMortemModalOpen] = useState(false);
  const [isDepositionModalOpen, setIsDepositionModalOpen] = useState(false);

  // Reviewer Demo Mode Feedback Toast
  const [demoToast, setDemoToast] = useState<{ message: string; submessage?: string } | null>(null);

  useEffect(() => {
    if (!demoToast) return;
    const timer = setTimeout(() => {
      setDemoToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [demoToast]);

  // Autosave to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to autosave notes to localStorage:', e);
    }
  }, [notes]);

  // Active note
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0];
  }, [notes, activeNoteId]);

  // Update note handler
  const handleUpdateNote = (updated: DocumentNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  // Create new blank thesis
  const handleNewNote = () => {
    const newNote: DocumentNote = {
      id: `note-${Date.now()}`,
      title: 'Untitled Legal / Policy Thesis',
      intellectualDomains: ['criminal-justice', 'public-policy'],
      epistemicStatus: 'unchallenged',
      resilienceScore: 35,
      falsifiabilityCriterion: '',
      untestedAssumptions: ['Initial baseline assumption requiring empirical validation.'],
      survivingCounterArguments: [],
      supportingPillars: [],
      counterEvidence: [],
      logicLintIssues: [],
      content: `# Untitled Legal / Policy Thesis\n\n## Central Thesis Statement\nState your bold, falsifiable legal, psychological, or policy claim here...\n\n## 1. Statutory & Evidentiary Pillars\n- Evidentiary Standard: \n- Key Case Law / Precedent: \n\n## 2. Anticipated Defense Objections & Administrative Bottlenecks\n- What will opposing counsel or fiscal comptrollers argue?`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setViewMode('edit');
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNoteId(remaining[0]?.id || '');
    }
  };

  // Duplicate note
  const handleDuplicateNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const copy: DocumentNote = {
      ...target,
      id: `note-${Date.now()}`,
      title: `${target.title} (Counter-Brief Branch)`,
      epistemicStatus: 'unchallenged',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [copy, ...prev]);
    setActiveNoteId(copy.id);
  };

  // Import notes
  const handleImportNotes = (imported: DocumentNote[]) => {
    setNotes(imported);
    if (imported.length > 0) {
      setActiveNoteId(imported[0].id);
    }
  };

  // Add Hegelian Synthesis note
  const handleCreateSynthesisNote = (synthesisNote: DocumentNote) => {
    setNotes((prev) => [synthesisNote, ...prev]);
    setActiveNoteId(synthesisNote.id);
    setViewMode('edit');
  };

  // Demo Mode: Master Reset All Test Cases
  const handleResetAllTestCases = () => {
    const freshNotes = JSON.parse(JSON.stringify(INITIAL_NOTES)) as DocumentNote[];
    setNotes(freshNotes);
    setActiveNoteId(freshNotes[0].id);
    setActivePersona('cross_examiner');
    setViewMode('edit');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshNotes));
    } catch (e) {
      console.warn('Failed to reset storage:', e);
    }
    setDemoToast({
      message: '⚡ 3 Domain Dossiers Reset with Active Flaws & Tensions',
      submessage: 'Restored Eyewitness Contamination, COMPAS Risk Scores, and Decarceration Net-Widening with active logic linter issues and adversarial citations.',
    });
  };

  // Demo Mode: Select Specific Test Case and Prime Tailored Adversary
  const handleSelectTestCase = (noteId: string, persona: SparringPersona) => {
    const exists = notes.some((n) => n.id === noteId);
    if (!exists) {
      const canonical = INITIAL_NOTES.find((n) => n.id === noteId);
      if (canonical) {
        setNotes((prev) => [JSON.parse(JSON.stringify(canonical)), ...prev]);
      }
    }
    setActiveNoteId(noteId);
    setActivePersona(persona);
    setViewMode('edit');

    const personaLabels: Record<SparringPersona, string> = {
      cross_examiner: 'The Hostile Cross-Examiner',
      empirical_criminologist: 'The Empirical Criminologist',
      bureaucratic_realist: 'The Bureaucratic Realist',
    };

    const targetNote = INITIAL_NOTES.find((n) => n.id === noteId) || notes.find((n) => n.id === noteId);
    setDemoToast({
      message: `Loaded: ${targetNote?.title.slice(0, 40)}...`,
      submessage: `Adversary primed: ${personaLabels[persona]} with active logic flaws in text.`,
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar: Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      // New note: Ctrl/Cmd + Alt + N
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes]);

  // Open tensions count (under_siege notes + counter evidence count)
  const openTensionsCount = useMemo(() => {
    return notes.filter((n) => n.epistemicStatus === 'under_siege').length + (activeNote?.counterEvidence.length || 0);
  }, [notes, activeNote]);

  const falsifiabilityDefined = Boolean(activeNote?.falsifiabilityCriterion?.trim());

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0A0E17] text-slate-100 select-none relative">
      {/* 3-Zone Top Navigation Contract with Real-Time Cognitive Telemetry & Demo Mode */}
      <TopNav
        activeNoteId={activeNoteId}
        activeNoteTitle={activeNote?.title || ''}
        epistemicStatus={activeNote?.epistemicStatus || 'unchallenged'}
        resilienceScore={activeNote?.resilienceScore || 50}
        openTensionsCount={openTensionsCount}
        activePersona={activePersona}
        falsifiabilityDefined={falsifiabilityDefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewNote={handleNewNote}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCitationsModal={() => setIsCitationsModalOpen(true)}
        onOpenPreMortemModal={() => setIsPreMortemModalOpen(true)}
        onOpenDepositionModal={() => setIsDepositionModalOpen(true)}
        onResetAllTestCases={handleResetAllTestCases}
        onSelectTestCase={handleSelectTestCase}
        supportingCount={activeNote?.supportingPillars.length || 0}
        counterCount={activeNote?.counterEvidence.length || 0}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isCopilotOpen={isCopilotOpen}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
      />

      {/* Main Workspace Frame (Fluid 3-Pane Architecture) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop for Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Epistemic Queue (Collapsible, Fixed Responsive Width) */}
        {sidebarOpen && (
          <Sidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={(id) => {
              setActiveNoteId(id);
              if (viewMode === 'graph') setViewMode('edit');
              if (window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            onNewNote={handleNewNote}
            onDeleteNote={handleDeleteNote}
            onDuplicateNote={handleDuplicateNote}
            onOpenHegelianModal={() => setIsHegelianModalOpen(true)}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        )}

        {/* Center Viewport (Fluid, Never Pushed Below the Fold) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#070A10] overflow-hidden relative">
          {activeNote ? (
            viewMode === 'graph' ? (
              <GraphView
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={(id) => {
                  setActiveNoteId(id);
                  setViewMode('edit');
                }}
                onCreateSynthesisNote={handleCreateSynthesisNote}
              />
            ) : (
              <Editor
                note={activeNote}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onUpdateNote={handleUpdateNote}
                onOpenCitationsModal={() => setIsCitationsModalOpen(true)}
                onOpenCopilot={() => setIsCopilotOpen(true)}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
              No active dossier selected. Click New Thesis or select a Test Case from Demo Mode above.
            </div>
          )}
        </main>

        {/* Backdrop for mobile copilot */}
        {isCopilotOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
            onClick={() => setIsCopilotOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Right Dialectical Sparring Arena (Collapsible, Fixed Responsive Width) */}
        {activeNote && (
          <AICopilotPanel
            note={activeNote}
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            onUpdateNote={handleUpdateNote}
            onOpenDepositionModal={() => setIsDepositionModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      {activeNote && (
        <CitationsModal
          note={activeNote}
          isOpen={isCitationsModalOpen}
          onClose={() => setIsCitationsModalOpen(false)}
          onUpdateNote={handleUpdateNote}
        />
      )}

      {activeNote && (
        <ExportModal
          note={activeNote}
          allNotes={notes}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onImportNotes={handleImportNotes}
        />
      )}

      <HegelianModal
        notes={notes}
        activeNoteId={activeNoteId}
        isOpen={isHegelianModalOpen}
        onClose={() => setIsHegelianModalOpen(false)}
        onCreateSynthesisNote={handleCreateSynthesisNote}
      />

      {activeNote && (
        <PreMortemModal
          note={activeNote}
          isOpen={isPreMortemModalOpen}
          onClose={() => setIsPreMortemModalOpen(false)}
          onUpdateNote={handleUpdateNote}
        />
      )}

      {activeNote && (
        <DepositionModal
          note={activeNote}
          isOpen={isDepositionModalOpen}
          onClose={() => setIsDepositionModalOpen(false)}
          onUpdateNote={handleUpdateNote}
          initialPersona={activePersona}
        />
      )}

      {/* Reviewer Feedback Toast */}
      {demoToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#0E1626] border border-amber-500/70 text-slate-100 rounded-xl p-3 shadow-2xl shadow-black/90 flex items-start gap-2.5 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-amber-300 font-sans">{demoToast.message}</div>
            {demoToast.submessage && (
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug font-sans">{demoToast.submessage}</div>
            )}
          </div>
          <button
            onClick={() => setDemoToast(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-1"
            aria-label="Dismiss toast"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
