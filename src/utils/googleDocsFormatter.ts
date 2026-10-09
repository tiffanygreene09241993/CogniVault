import { DocumentNote } from '../types';

export interface FormattedGoogleDoc {
  title: string;
  outline: string[];
  html: string;
  plainText: string;
}

/**
 * Formats a DocumentNote into a clean, publication-ready Google Docs / Drive document structure
 * including the complete Epistemic Audit Header, thesis content, and evidentiary appendices.
 */
export function formatThesisForGoogleDocs(note: DocumentNote): FormattedGoogleDoc {
  const auditDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statusColor =
    note.epistemicStatus === 'resilient'
      ? '#059669' // emerald-600
      : note.epistemicStatus === 'under_siege'
      ? '#e11d48' // rose-600
      : '#d97706'; // amber-600

  const statusLabel =
    note.epistemicStatus === 'resilient'
      ? 'RESILIENT (EMPIRICALLY TESTED)'
      : note.epistemicStatus === 'under_siege'
      ? 'UNDER ADVERSARIAL SIEGE'
      : 'UNCHALLENGED (SPECULATIVE)';

  const outline = [
    'Document Header & Metadata',
    'Epistemic Audit & Verification Ledger',
    'Executive Thesis & Core Body',
    'Popperian Falsifiability Standard',
    'Surviving Adversarial Counter-Arguments',
    'Declared Untested Assumptions',
    'Empirical Evidence Ledger (Supporting & Opposing)',
  ];

  // Build clean HTML formatted specifically for Google Docs rich-text paste and document download
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${note.title} - CogniVault Audited Thesis</title>
<style>
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #1a202c;
    line-height: 1.6;
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
  }
  h1 {
    font-size: 24pt;
    color: #0f172a;
    margin-bottom: 6px;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 8px;
  }
  .doc-subtitle {
    font-size: 11pt;
    color: #475569;
    margin-bottom: 24px;
    font-style: italic;
  }
  .audit-ledger {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 6px solid ${statusColor};
    padding: 16px;
    border-radius: 4px;
    margin: 20px 0 30px 0;
  }
  .audit-title {
    font-size: 11pt;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }
  table.audit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  table.audit-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  table.audit-table td.label {
    font-weight: bold;
    color: #334155;
    width: 35%;
  }
  table.audit-table td.value {
    color: #0f172a;
  }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    font-weight: bold;
    font-size: 9pt;
    border-radius: 3px;
    background-color: ${statusColor};
    color: #ffffff;
  }
  h2 {
    font-size: 16pt;
    color: #0f172a;
    margin-top: 32px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  h3 {
    font-size: 13pt;
    color: #1e293b;
    margin-top: 20px;
  }
  p {
    font-size: 11pt;
    margin-bottom: 14px;
  }
  blockquote {
    border-left: 4px solid #0284c7;
    background-color: #f0f9ff;
    padding: 12px 16px;
    margin: 16px 0;
    font-style: italic;
    color: #0369a1;
  }
  ul, ol {
    margin-bottom: 16px;
    padding-left: 24px;
  }
  li {
    margin-bottom: 6px;
    font-size: 11pt;
  }
  .appendix-header {
    background-color: #0f172a;
    color: #ffffff;
    padding: 8px 14px;
    border-radius: 4px;
    margin-top: 40px;
    font-size: 13pt;
    font-weight: bold;
  }
  .source-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 10px 14px;
    margin-bottom: 10px;
    border-radius: 4px;
  }
  .source-title {
    font-weight: bold;
    font-size: 10.5pt;
    color: #0f172a;
  }
  .source-snippet {
    font-size: 10pt;
    color: #475569;
    font-style: italic;
    margin-top: 4px;
  }
  .footer-note {
    font-size: 9pt;
    color: #94a3b8;
    text-align: center;
    margin-top: 40px;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
  }
</style>
</head>
<body>

<h1>${note.title}</h1>
<div class="doc-subtitle">
  CogniVault Research Thesis Dossier &bull; Prepared: ${auditDate} &bull; Domains: ${note.intellectualDomains.join(', ')}
</div>

<!-- ================= EPISTEMIC AUDIT HEADER ================= -->
<div class="audit-ledger">
  <div class="audit-title">Verifiable Epistemic Audit Report</div>
  <table class="audit-table">
    <tr>
      <td class="label">Epistemic Status:</td>
      <td class="value"><span class="status-badge">${statusLabel}</span></td>
    </tr>
    <tr>
      <td class="label">Resilience Index:</td>
      <td class="value"><strong>${note.resilienceScore}%</strong></td>
    </tr>
    <tr>
      <td class="label">Popperian Falsifiability Criterion:</td>
      <td class="value"><em>${note.falsifiabilityCriterion || 'NONE DECLARED (Speculative - Subject to Refutation)'}</em></td>
    </tr>
    <tr>
      <td class="label">Intellectual Domains:</td>
      <td class="value">${note.intellectualDomains.join(', ')}</td>
    </tr>
    <tr>
      <td class="label">Empirical Evidence Ledger:</td>
      <td class="value">${note.supportingPillars.length} Supporting Pillar(s) &bull; ${note.counterEvidence.length} Opposing Counter-Evidence</td>
    </tr>
    <tr>
      <td class="label">Surviving Counter-Arguments Addressed:</td>
      <td class="value">${note.survivingCounterArguments.length} recorded adversarial rebuttals</td>
    </tr>
    <tr>
      <td class="label">Declared Untested Assumptions:</td>
      <td class="value">${note.untestedAssumptions.length} pending falsification criteria</td>
    </tr>
    <tr>
      <td class="label">Audit Synchronization Date:</td>
      <td class="value">${new Date().toISOString()}</td>
    </tr>
  </table>
</div>

<!-- ================= CORE THESIS BODY ================= -->
<h2>1. Executive Brief &amp; Grounded Thesis</h2>
<div>
${note.content
  .split('\n\n')
  .map((p) => {
    const trimmed = p.trim();
    if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
    if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
    if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
    if (trimmed.startsWith('> ')) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
    if (trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').map((li) => `<li>${li.replace(/^[-\*]\s*/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  })
  .join('\n')}
</div>

<!-- ================= APPENDIX ================= -->
<div class="appendix-header">Appendix: Verifiable Epistemic Ledger</div>

<h3>A. Popperian Falsifiability Standard</h3>
<blockquote>
  <strong>Falsification Condition:</strong> ${note.falsifiabilityCriterion || 'No explicit empirical refutation criterion declared. Thesis remains vulnerable under adversarial review.'}
</blockquote>

<h3>B. Surviving Adversarial Counter-Arguments (${note.survivingCounterArguments.length})</h3>
${
  note.survivingCounterArguments.length > 0
    ? `<ol>${note.survivingCounterArguments.map((arg) => `<li><strong>Rebuttal Recorded:</strong> ${arg}</li>`).join('')}</ol>`
    : '<p><em>No surviving counter-arguments recorded. Run the Deposition Simulator to stress-test this thesis under oath.</em></p>'
}

<h3>C. Declared Untested Assumptions (${note.untestedAssumptions.length})</h3>
${
  note.untestedAssumptions.length > 0
    ? `<ul>${note.untestedAssumptions.map((assum) => `<li><strong>Untested Premise:</strong> ${assum}</li>`).join('')}</ul>`
    : '<p><em>No untested assumptions declared.</em></p>'
}

<h3>D. Bifurcated Empirical Evidence Ledger</h3>
<h4>Supporting Pillars (${note.supportingPillars.length})</h4>
${
  note.supportingPillars.length > 0
    ? note.supportingPillars
        .map(
          (p, i) => `
  <div class="source-card">
    <div class="source-title">[Pillar ${i + 1}] ${p.title}</div>
    ${p.url ? `<div><a href="${p.url}">${p.url}</a></div>` : ''}
    ${p.snippet ? `<div class="source-snippet">"${p.snippet}"</div>` : ''}
  </div>`
        )
        .join('')
    : '<p><em>Zero supporting pillars attached.</em></p>'
}

<h4>Opposing Counter-Evidence (${note.counterEvidence.length})</h4>
${
  note.counterEvidence.length > 0
    ? note.counterEvidence
        .map(
          (c, i) => `
  <div class="source-card">
    <div class="source-title">[Counter-Evidence ${i + 1}] ${c.title}</div>
    ${c.url ? `<div><a href="${c.url}">${c.url}</a></div>` : ''}
    ${c.snippet ? `<div class="source-snippet">"${c.snippet}"</div>` : ''}
  </div>`
        )
        .join('')
    : '<p><em>Zero opposing counter-evidence documented. Add counter-evidence to graduate this thesis to Resilient.</em></p>'
}

<div class="footer-note">
  Generated by CogniVault &bull; In-App Adversarial Crucible &amp; Epistemic Audit Engine &bull; Google Workspace Export
</div>

</body>
</html>`;

  // Plain-text representation for standard clipboard fallback
  const plainText = `================================================================================
${note.title.toUpperCase()}
CogniVault Research Thesis Dossier
================================================================================
EPISTEMIC AUDIT REPORT
- Epistemic Status: ${statusLabel}
- Resilience Index: ${note.resilienceScore}%
- Falsifiability Criterion: ${note.falsifiabilityCriterion || 'NONE DECLARED'}
- Intellectual Domains: ${note.intellectualDomains.join(', ')}
- Supporting Pillars: ${note.supportingPillars.length}
- Opposing Counter-Evidence: ${note.counterEvidence.length}
- Surviving Counter-Arguments Addressed: ${note.survivingCounterArguments.length}
- Declared Untested Assumptions: ${note.untestedAssumptions.length}
- Timestamp: ${new Date().toISOString()}
================================================================================

1. EXECUTIVE BRIEF & GROUNDED THESIS
${note.content}

================================================================================
APPENDIX: VERIFIABLE EPISTEMIC LEDGER
================================================================================

A. POPPERIAN FALSIFIABILITY STANDARD
> ${note.falsifiabilityCriterion || 'No explicit refutation criterion declared.'}

B. SURVIVING ADVERSARIAL COUNTER-ARGUMENTS
${note.survivingCounterArguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n') || 'None recorded.'}

C. DECLARED UNTESTED ASSUMPTIONS
${note.untestedAssumptions.map((assum, i) => `- [ ] ${assum}`).join('\n') || 'None declared.'}

D. EMPIRICAL EVIDENCE LEDGER
Supporting Pillars:
${note.supportingPillars.map((p, i) => `[Pillar ${i + 1}] ${p.title} (${p.url || 'No URL'}) - "${p.snippet}"`).join('\n') || 'None'}

Opposing Counter-Evidence:
${note.counterEvidence.map((c, i) => `[Counter ${i + 1}] ${c.title} (${c.url || 'No URL'}) - "${c.snippet}"`).join('\n') || 'None'}
`;

  return {
    title: note.title,
    outline,
    html,
    plainText,
  };
}
