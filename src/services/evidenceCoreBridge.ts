/**
 * Evidence Core Bridge for CogniVault
 *
 * Reads the approved inventory from an Evidence Core store and
 * enforces the grounding rule before any agent output is shown.
 *
 * Does not approve artifacts. Does not store personal content.
 */

export interface ApprovedArtifact {
  filename: string;
  type: string;
  sha256: string;
  proves: string;
  does_not_prove: string;
}

export interface ValidationIssue {
  line: number;
  type: string;
  message: string;
}

export interface BridgeResult {
  prompt: string;
  approvedFilenames: string[];
  validation?: {
    passed: boolean;
    issues: ValidationIssue[];
  };
}

/**
 * Minimal interface the bridge expects from an Evidence Core store.
 */
export interface EvidenceCoreReader {
  getApprovedInventory(caseId: string): Promise<ApprovedArtifact[]>;
}

/**
 * Simple grounding check (compatible with the AETHER validator contract).
 * Flags citations of filenames not in the approved list and uncited claims
 * that lack the exact [UNREFERENCED] marker.
 */
export function validateAgentGrounding(
  agentOutput: string,
  approvedFilenames: string[]
): { passed: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const lines = agentOutput.split('\n');
  const approvedSet = new Set(approvedFilenames);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const citationMatches = line.match(/\[([^\]]+)\]/g) || [];
    citationMatches.forEach((match) => {
      const name = match.slice(1, -1).trim();
      if (name === 'UNREFERENCED') return;
      if (!approvedSet.has(name)) {
        issues.push({
          line: lineNum,
          type: 'unapproved_citation',
          message: `Citation "${name}" is not in the approved inventory`,
        });
      }
    });

    // Heuristic: a factual-looking sentence without a citation and without [UNREFERENCED]
    const hasCitation = citationMatches.length > 0;
    const hasUnreferenced = line.includes('[UNREFERENCED]');
    const looksFactual = /\b(was|were|recorded|occurred|showed|demonstrated)\b/i.test(line);
    if (looksFactual && !hasCitation && !hasUnreferenced && line.trim().length > 20) {
      issues.push({
        line: lineNum,
        type: 'uncited_claim',
        message: 'Factual claim lacks a citation and is not marked [UNREFERENCED]',
      });
    }
  });

  return { passed: issues.length === 0, issues };
}

/**
 * Builds a sparring / drafting prompt that includes only approved artifacts
 * and the mandatory grounding rule.
 */
export function buildGroundedPrompt(
  caseId: string,
  inventory: ApprovedArtifact[],
  userQuestion: string
): string {
  const filenames = inventory.map((a) => a.filename);

  const inventoryBlock =
    filenames.length === 0
      ? 'No approved artifacts are available for this case.'
      : filenames.map((f) => `- ${f}`).join('\n');

  return `You are assisting with case ${caseId}.

GROUNDING RULE (mandatory):
- You may cite ONLY the approved artifact filenames listed below.
- If a fact is not supported by one of those filenames, mark it exactly [UNREFERENCED].
- Never invent hashes, timestamps, or content.
- Never claim an artifact is approved if it is not in the list.

APPROVED INVENTORY:
${inventoryBlock}

USER QUESTION:
${userQuestion}

Respond with a clear draft. Cite approved filenames in square brackets. Mark unsupported claims [UNREFERENCED].`;
}

/**
 * Main bridge entry point.
 */
export async function runEvidenceCoreBridge(
  reader: EvidenceCoreReader,
  caseId: string,
  userQuestion: string,
  agentDraft?: string
): Promise<BridgeResult> {
  const inventory = await reader.getApprovedInventory(caseId);
  const approvedFilenames = inventory.map((a) => a.filename);

  const prompt = buildGroundedPrompt(caseId, inventory, userQuestion);

  let validation;
  if (agentDraft) {
    const report = validateAgentGrounding(agentDraft, approvedFilenames);
    validation = {
      passed: report.passed,
      issues: report.issues,
    };
  }

  return {
    prompt,
    approvedFilenames,
    validation,
  };
}

/**
 * Example local-file reader (for development).
 * Replace with a call to the real Evidence Core store or API.
 */
export class LocalJsonEvidenceCoreReader implements EvidenceCoreReader {
  constructor(private inventoryPath: string) {}

  async getApprovedInventory(_caseId: string): Promise<ApprovedArtifact[]> {
    // Stub: returns empty so the bridge stays safe by default.
    // Wire this to the Python Evidence Core store or an API later.
    return [];
  }
}
