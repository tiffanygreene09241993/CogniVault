export type EpistemicStatus = 'unchallenged' | 'under_siege' | 'resilient';

export type SparringPersona = 'cross_examiner' | 'bureaucratic_realist' | 'empirical_criminologist';

export interface CitationSource {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  dateAdded: string;
}

export interface DefenseClause {
  id: string;
  title: string;
  statutoryBasisOrPrecedent: string; // e.g. "Fed. R. Evid. 702 / Daubert v. Merrell Dow"
  clauseText: string;
}

export interface LogicLintIssue {
  id: string;
  passage: string;
  type: 'ungrounded_assertion' | 'logical_fallacy' | 'causal_leap';
  severity: 'warning' | 'critical';
  explanation: string;
  remedyAction: 'demand_citation' | 'steel_man_rebuttal';
  suggestedRebuttal?: string;
  inoculationClause?: DefenseClause;
}

export interface EpistemicEdge {
  id: string;
  source: string;
  target: string;
  type: 'contradicts' | 'assumes' | 'supports';
  label: string;
}

export interface DocumentNote {
  id: string;
  title: string;
  content: string; // Markdown text
  intellectualDomains: string[]; // e.g. ['forensic-psychology', 'due-process']
  epistemicStatus: EpistemicStatus;
  resilienceScore: number; // 0 to 100
  falsifiabilityCriterion: string; // Mandatory for 'resilient' status
  untestedAssumptions: string[];
  survivingCounterArguments: string[];
  supportingPillars: CitationSource[];
  counterEvidence: CitationSource[];
  logicLintIssues: LogicLintIssue[];
  createdAt: string;
  updatedAt: string;
  session?: NoteSession;
}

export interface DepositionExchange {
  question: string;
  answer: string;
  target: string;
}

export interface DepositionRecord {
  persona: SparringPersona;
  round: number;
  exchanges: DepositionExchange[];
  currentQuestion: string | null;
  targetVulnerability: string | null;
  result: {
    survivalScore: number;
    witnessAssessment: string;
    defenseClauses?: DefenseClause[];
  } | null;
  updatedAt: string;
}

export interface NoteSession {
  sparring?: Partial<Record<SparringPersona, SparringMessage[]>>;
  deposition?: DepositionRecord;
  preMortem?: PreMortemReport;
}

export interface SparringMessage {
  id: string;
  persona: SparringPersona;
  role: 'user' | 'assistant';
  content: string;
  critiquePillars?: string[];
  suggestedFalsificationTest?: string;
  epistemicFrictionDemand?: string;
  defenseClauses?: DefenseClause[];
  timestamp: string;
}

export interface DepositionQuestion {
  questionNumber: number;
  interrogation: string;
  vulnerabilityTargeted: string;
}

export interface PreMortemFailureStage {
  year: number;
  phase: string;
  bottleneck: string;
  unmodeledBehavior: string;
  catastrophicImpact: string;
}

export interface PreMortemReport {
  executiveAutopsy: string;
  timeline: PreMortemFailureStage[];
  defensiveClauses: string[];
  vulnerabilityScore: number;
  analyzedAt: string;
}

export type ViewMode = 'edit' | 'canvas' | 'graph';
