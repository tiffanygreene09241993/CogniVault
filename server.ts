import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.DISABLE_HMR = 'true';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure Vite client never throws unhandled WebSocket rejection in AI Studio iframe
try {
  const clientPath = path.resolve(__dirname, 'node_modules/vite/dist/client/client.mjs');
  if (fs.existsSync(clientPath)) {
    let clientSource = fs.readFileSync(clientPath, 'utf8');
    const target = 'reject(/* @__PURE__ */ new Error("WebSocket closed without opened."));';
    if (clientSource.includes(target)) {
      clientSource = clientSource.replace(target, 'resolve();');
      fs.writeFileSync(clientPath, clientSource);
    }
  }
} catch (e) {
  // Silently ignore
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client
function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient Gemini generator with retry and model fallback
async function callGemini(params: { contents: any; config?: any }) {
  const ai = getAIClient();
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        if (msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE')) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }
  throw lastError || new Error('Failed to generate content from Gemini.');
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// CORE DIRECTIVE CONSTANT
const ADVERSARIAL_CRUCIBLE_CORE = `
ROLE: IN-APP ADVERSARIAL CRUCIBLE & SPARRING AGENT
APPLICATION: COGNIVAULT
DOMAINS: Criminal Justice, Forensic Psychology, and Public Administration/Policy

OPERATIONAL OBJECTIVE:
You are an embedded adversarial sparring partner within CogniVault. You do not function as a polite writing assistant, summarizer, or cheerleader. Your mandate is to stress-test briefs, evaluations, and policy proposals by simulating high-stakes legal cross-examination, empirical methodology audits, and municipal administrative scrutiny before the user faces opposing counsel, peer reviewers, or agency directors.

CORE EXECUTION RULES:
1. ZERO SYCOPHANCY:
   NEVER open with pleasantries, praise, or validation (e.g., "Good point", "I understand your approach", "That's an interesting thesis", "You make an interesting observation").
   Jump DIRECTLY into the deconstruction, deposition question, or counter-evidence.
2. EPISTEMIC FRICTION:
   When an assertion lacks empirical or statutory grounding, flag it immediately as an ungrounded assumption and demand the falsification criteria ("What observable condition would prove this claim false?").
3. ACTIONABLE DEFENSE CLAUSES:
   Conclude every critique or deposition round by providing 1–2 concrete defensive clauses, evidentiary safeguards, or statutory citations the user can immediately insert into their text to inoculate the draft against real-world attack.
`;

// 1. INLINE LOGIC LINTER: Detects ungrounded assertions, causal leaps, and fallacies
app.post('/api/gemini/logic-lint', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Document content is required.' });
      return;
    }

    const prompt = `${ADVERSARIAL_CRUCIBLE_CORE}

Analyze the provided research draft with clinical skepticism across Criminal Justice, Forensic Psychology, and Public Policy.
Locate 3 to 5 of the most legally or empirically vulnerable sentences or short claims.

Look specifically for:
1. "ungrounded_assertion": Statements lacking statutory citations, empirical references, or Daubert/Frye foundation.
2. "logical_fallacy": Circular legal reasoning, ecological fallacies in aggregate crime data, or composition fallacies in policy.
3. "causal_leap": Claiming intervention X causes crime reduction Y without accounting for regression-to-the-mean, confounding policing allocations, or street-level bureaucrat discretion drift.

CRITICAL: For each issue, provide a concrete Inoculation Defense Clause (statutory citation and precise defensive language) that inoculates the draft. Extract verbatim substrings for the "passage" field.

Document Title: ${title || 'CogniVault Thesis'}
Content:
${content}

Provide response in structured JSON matching schema.`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallResilienceScore: {
              type: Type.NUMBER,
              description: 'Score from 0 (completely vulnerable) to 100 (airtight empirical rigor).',
            },
            untestedAssumptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Foundational implicit assumptions taken for granted.',
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  passage: {
                    type: Type.STRING,
                    description: 'Exact verbatim excerpt from the document containing the issue.',
                  },
                  type: {
                    type: Type.STRING,
                    description: 'Must be one of: ungrounded_assertion, logical_fallacy, causal_leap',
                  },
                  severity: {
                    type: Type.STRING,
                    description: 'Must be one of: warning, critical',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Clinical deconstruction of why this logic is vulnerable under scrutiny.',
                  },
                  remedyAction: {
                    type: Type.STRING,
                    description: 'Must be either "demand_citation" or "steel_man_rebuttal".',
                  },
                  suggestedRebuttal: {
                    type: Type.STRING,
                    description: 'The fortified counter-argument or replacement phrasing.',
                  },
                  inoculationClause: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      statutoryBasisOrPrecedent: { type: Type.STRING },
                      clauseText: { type: Type.STRING },
                    },
                    required: ['title', 'statutoryBasisOrPrecedent', 'clauseText'],
                  },
                },
                required: ['passage', 'type', 'severity', 'explanation', 'remedyAction'],
              },
            },
          },
          required: ['overallResilienceScore', 'untestedAssumptions', 'issues'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const issuesWithIds = (parsed.issues || []).map((issue: any, index: number) => ({
      ...issue,
      id: `lint-${Date.now()}-${index}`,
      inoculationClause: issue.inoculationClause ? {
        ...issue.inoculationClause,
        id: `clause-${Date.now()}-${index}`,
      } : undefined,
    }));

    res.json({
      overallResilienceScore: Math.round(parsed.overallResilienceScore || 50),
      untestedAssumptions: parsed.untestedAssumptions || [],
      issues: issuesWithIds,
      scannedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Logic lint error:', error);
    res.status(500).json({ error: error?.message || 'Failed to complete logic lint.' });
  }
});

// 2. RETUNED ADVERSARIAL SPARRING ARENA: Enforcing Zero Sycophancy & Defense Clauses
app.post('/api/gemini/spar-persona', async (req: Request, res: Response) => {
  try {
    const {
      persona,
      noteTitle,
      noteContent,
      userMessage,
      history,
      falsifiabilityCriterion,
    } = req.body;

    if (!userMessage && !noteContent) {
      res.status(400).json({ error: 'Context is required to spar.' });
      return;
    }

    let personaDirective = '';
    switch (persona) {
      case 'cross_examiner':
        personaDirective = `PERSONA 1: THE HOSTILE CROSS-EXAMINER (Defense / Prosecutorial Counsel)
Attack vectors: Chain of custody, cognitive bias, suggestive interviewing (Reid vs. PEACE), witness contamination, Daubert/Frye scientific admissibility, and constitutional challenges under the 4th, 5th, 6th, and 14th Amendments.
Tone: Incisive, clinical, skeptical, courtroom-ready. Fire rapid, targeted deconstructions that attack the weakest link in testimony, investigative procedures, or clinical evaluations.`;
        break;
      case 'bureaucratic_realist':
        personaDirective = `PERSONA 2: THE BUREAUCRATIC REALIST (Budget Director / City Manager / Agency Chief)
Attack vectors: Unfunded mandates, federal grant drop-offs (Year 2/3 cliffs), collective bargaining/union pushback, administrative compliance friction, and street-level bureaucratic drift (Lipsky).
Tone: Pragmatic, weary, operational, risk-averse. Evaluate policies based on frontline enforcement friction, budget sustainability, and unintended consequences (e.g., net-widening).`;
        break;
      case 'empirical_criminologist':
      default:
        personaDirective = `PERSONA 3: THE EMPIRICAL CRIMINOLOGIST (Methodological Purist / Lead Statistician)
Attack vectors: Sampling bias, regression to the mean, ecological fallacies in NIBRS/UCR data, confounding variables, algorithmic disparity vs. calibration, and Popperian falsifiability.
Tone: Academic, rigorous, data-driven. Refuse to treat correlation as causation or police contact as an objective proxy for underlying offending.`;
        break;
    }

    const conversationHistoryStr = Array.isArray(history) && history.length > 0
      ? history.map((h: any) => `${h.role === 'user' ? 'Author' : 'Opponent'}: ${h.content}`).join('\n\n')
      : 'No prior turns.';

    const systemPrompt = `${ADVERSARIAL_CRUCIBLE_CORE}

ACTIVE PERSONA:
${personaDirective}

MANDATORY RESPONSE REQUIREMENTS:
1. ZERO SYCOPHANCY:
   Do NOT open with pleasantries, greetings, praise, or acknowledgment of the thesis ("Good point", "I understand your approach", "Interesting thesis").
   Start IMMEDIATELY with the clinical deconstruction.
2. EPISTEMIC FRICTION:
   If the author makes a claim without statutory or empirical proof, flag it as an ungrounded assumption and demand the falsification criteria: "What observable condition would prove this claim false?"
3. ACTIONABLE DEFENSE CLAUSES:
   Conclude by formulating 1–2 concrete defensive clauses, evidentiary safeguards, or statutory citations the user can immediately insert into their text to inoculate the draft against real-world attack.

Document Context:
Title: "${noteTitle || 'CogniVault Thesis'}"
Declared Falsifiability Criterion: "${falsifiabilityCriterion || 'NONE DECLARED YET'}"
Document Excerpt:
${(noteContent || '').slice(0, 2500)}

Prior Debate History:
${conversationHistoryStr}

Current Author Defense / Statement:
"${userMessage || 'Cross-examine my central thesis.'}"

Return structured JSON according to the schema.`;

    const response = await callGemini({
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Incisive adversarial deconstruction in Markdown format. NO pleasantries.',
            },
            critiquePillars: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 key legal, psychological, or operational vulnerabilities exposed.',
            },
            epistemicFrictionDemand: {
              type: Type.STRING,
              description: 'Explicit demand for falsification criteria if an ungrounded assumption is exposed.',
            },
            defenseClauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Short label for the defensive safeguard' },
                  statutoryBasisOrPrecedent: { type: Type.STRING, description: 'Statute, case law, or evidentiary rule (e.g. Fed. R. Evid. 702, State v. Henderson, Lipsky §4)' },
                  clauseText: { type: Type.STRING, description: 'Ready-to-insert contractual covenant or defensive clause text' },
                },
                required: ['title', 'statutoryBasisOrPrecedent', 'clauseText'],
              },
              description: '1-2 concrete defensive clauses to inoculate the draft against real-world attack.',
            },
            suggestedFalsificationTest: {
              type: Type.STRING,
              description: 'A specific empirical test or thought experiment that would falsify the argument.',
            },
            resilienceDelta: {
              type: Type.NUMBER,
              description: 'Evaluation of the author defence: -10 (fell apart) to +10 (successfully defended).',
            },
          },
          required: ['reply', 'critiquePillars', 'defenseClauses', 'resilienceDelta'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const defenseClausesWithIds = (parsed.defenseClauses || []).map((c: any, index: number) => ({
      ...c,
      id: `clause-${Date.now()}-${index}`,
    }));

    res.json({
      ...parsed,
      defenseClauses: defenseClausesWithIds,
    });
  } catch (error: any) {
    console.error('Sparring persona error:', error);
    res.status(500).json({ error: error?.message || 'Sparring round failed.' });
  }
});

// 3. DEPOSITION / MOCK HEARING MODE: Under-oath interrogation concluding with defense safeguards
app.post('/api/gemini/deposition-challenge', async (req: Request, res: Response) => {
  try {
    const {
      persona,
      noteTitle,
      noteContent,
      round,
      priorExchanges,
      userDefense,
    } = req.body;

    const roundNum = Number(round) || 1;
    const isFinalEvaluation = roundNum > 3;

    const prompt = `${ADVERSARIAL_CRUCIBLE_CORE}

You are conducting a formal 3-Minute Expert Witness Deposition or Legislative Committee Cross-Examination under oath.
Active Persona: ${persona || 'The Hostile Cross-Examiner'}.

Document Title: "${noteTitle}"
Document Content:
${(noteContent || '').slice(0, 2500)}

Round Number: ${roundNum} of 3
Prior Interrogations and Answers:
${Array.isArray(priorExchanges) ? priorExchanges.map((e: any) => `Q: ${e.question}\nA: ${e.answer}`).join('\n\n') : 'Opening exchange.'}

Latest Witness Defense:
"${userDefense || 'Opening testimony.'}"

${
  isFinalEvaluation
    ? `The cross-examination is concluded. Evaluate the witness's total performance. Calculate a Cross-Examination Survival Score (0-100%). Identify whether the witness committed perjury, conceded critical points, or preserved credibility under Daubert/policy scrutiny. Provide 2 actionable defensive clauses or evidentiary safeguards to insulate the testimony.`
    : `Generate Question #${roundNum}. It must be an aggressive, direct, single-pointed cross-examination interrogation question targeting an unproven assertion, procedural loophole, or budget disaster in the witness's thesis. Demand a concrete answer. Conclude with 1 actionable defense clause.`
}

Return structured JSON according to the schema.`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFinal: { type: Type.BOOLEAN },
            nextQuestion: {
              type: Type.STRING,
              description: 'The sharp interrogation question to fire at the witness.',
            },
            targetVulnerability: {
              type: Type.STRING,
              description: 'The specific weakness targeted in this question.',
            },
            survivalScore: {
              type: Type.NUMBER,
              description: 'Survival score from 0 to 100 based on defense rigor.',
            },
            witnessAssessment: {
              type: Type.STRING,
              description: 'Comprehensive verdict on the witness credibility and surviving claims.',
            },
            defenseClauses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  statutoryBasisOrPrecedent: { type: Type.STRING },
                  clauseText: { type: Type.STRING },
                },
                required: ['title', 'statutoryBasisOrPrecedent', 'clauseText'],
              },
            },
          },
          required: ['isFinal', 'survivalScore', 'witnessAssessment', 'defenseClauses'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const defenseClausesWithIds = (parsed.defenseClauses || []).map((c: any, index: number) => ({
      ...c,
      id: `dep-clause-${Date.now()}-${index}`,
    }));

    res.json({
      ...parsed,
      defenseClauses: defenseClausesWithIds,
    });
  } catch (error: any) {
    console.error('Deposition error:', error);
    res.status(500).json({ error: error?.message || 'Deposition challenge failed.' });
  }
});

// 4. POLICY PRE-MORTEM: Unintended Consequences Audit
app.post('/api/gemini/policy-pre-mortem', async (req: Request, res: Response) => {
  try {
    const { title, content, intellectualDomains } = req.body;

    const prompt = `${ADVERSARIAL_CRUCIBLE_CORE}

Conduct a rigorous 3-Year "PRE-MORTEM / UNINTENDED CONSEQUENCES AUDIT" on the following policy or criminological proposal.
ASSUME THE PROPOSAL HAS CATASTROPHICALLY FAILED BY YEAR 3.

Your autopsy must detail:
1. Year 1: Street-Level Bureaucracy Drift & Discretion Distortion (How front-line officers, case workers, or judges subtly altered or bypassed the rules - Lipsky framework).
2. Year 2: Administrative Friction, Net-Widening & Attrition Bottlenecks (How paperwork, tracking failures, and unintended population capture diluted effectiveness).
3. Year 3: Fiscal Cliff, Legal Injunction, or Backlash Shock (How grant expiration, union litigation, or high-profile anomalies froze the program).
4. Provide 3-4 concrete, legal-grade DEFENSIVE POLICY CLAUSES to insert into the draft right now to insulate the program against these exact failure modes.

Proposal Title: "${title || 'CogniVault Proposal'}"
Domains: ${Array.isArray(intellectualDomains) ? intellectualDomains.join(', ') : 'Criminal Justice & Public Administration'}
Content:
${(content || '').slice(0, 3000)}

Return structured JSON.`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveAutopsy: {
              type: Type.STRING,
              description: 'Executive summary explaining why the initiative collapsed despite good intentions.',
            },
            vulnerabilityScore: {
              type: Type.NUMBER,
              description: 'Pre-mortem vulnerability index (0 = rock solid, 100 = guaranteed administrative failure).',
            },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.NUMBER },
                  phase: { type: Type.STRING },
                  bottleneck: { type: Type.STRING },
                  unmodeledBehavior: { type: Type.STRING },
                  catastrophicImpact: { type: Type.STRING },
                },
                required: ['year', 'phase', 'bottleneck', 'unmodeledBehavior', 'catastrophicImpact'],
              },
            },
            defensiveClauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Ready-to-insert policy covenants, statutory definitions, or audit requirements.',
            },
          },
          required: ['executiveAutopsy', 'vulnerabilityScore', 'timeline', 'defensiveClauses'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      ...parsed,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Policy pre-mortem error:', error);
    res.status(500).json({ error: error?.message || 'Policy pre-mortem simulation failed.' });
  }
});

// 5. HEGELIAN SYNTHESIS
app.post('/api/gemini/hegelian-synthesis', async (req: Request, res: Response) => {
  try {
    const { thesisTitle, thesisContent, antithesisTitle, antithesisContent } = req.body;

    if (!thesisTitle || !antithesisTitle) {
      res.status(400).json({ error: 'Both thesis and antithesis titles are required.' });
      return;
    }

    const prompt = `${ADVERSARIAL_CRUCIBLE_CORE}

Two distinct positions or policies in this research vault are in direct intellectual conflict:

THESIS:
Title: "${thesisTitle}"
Content:
${(thesisContent || '').slice(0, 2000)}

ANTITHESIS:
Title: "${antithesisTitle}"
Content:
${(antithesisContent || '').slice(0, 2000)}

Formulate a genuine Hegelian SYNTHESIS (Aufhebung).
Do NOT offer a lukewarm compromise ("both have merits").
Discover the higher-order legal framework, procedural standard, or administrative architecture that resolves the constitutional or empirical contradiction.
Provide structured JSON.`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesisTitle: { type: Type.STRING },
            resolvingMechanism: { type: Type.STRING },
            synthesisMarkdown: { type: Type.STRING },
            intellectualDomains: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            falsifiabilityCriterion: { type: Type.STRING },
          },
          required: [
            'synthesisTitle',
            'resolvingMechanism',
            'synthesisMarkdown',
            'intellectualDomains',
            'falsifiabilityCriterion',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Hegelian synthesis error:', error);
    res.status(500).json({ error: error?.message || 'Hegelian synthesis generation failed.' });
  }
});

// 6. COUNTER-EVIDENCE DISCOVERY
app.post('/api/gemini/counter-evidence', async (req: Request, res: Response) => {
  try {
    const { title, content, intellectualDomains } = req.body;

    const prompt = `${ADVERSARIAL_CRUCIBLE_CORE}

Given this research premise in criminal justice, forensic psychology, or public administration, discover 2-3 genuine published empirical studies, landmark circuit decisions, or meta-analyses that challenge or qualify this conclusion.

Title: "${title || 'CogniVault Thesis'}"
Domains: ${Array.isArray(intellectualDomains) ? intellectualDomains.join(', ') : 'Interdisciplinary'}
Content:
${(content || '').slice(0, 2500)}

Return structured counter-evidence items.`;

    const response = await callGemini({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            counterItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                  url: { type: Type.STRING },
                },
                required: ['title', 'snippet'],
              },
            },
          },
          required: ['counterItems'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Counter evidence error:', error);
    res.status(500).json({ error: error?.message || 'Failed to discover counter-evidence.' });
  }
});

// 7. CITATION & BIBTEX / DOI RESOLUTION ENDPOINT
app.post('/api/citations/parse', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    if (!input || typeof input !== 'string') {
      res.status(400).json({ error: 'Raw BibTeX snippet or DOI string is required.' });
      return;
    }

    const trimmed = input.trim();
    // Check if DOI
    const doiMatch = trimmed.match(/(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/i);
    if (doiMatch) {
      const doi = doiMatch[1].replace(/[.,;)]+$/, '');
      try {
        const crossrefRes = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
          headers: { 'User-Agent': 'CogniVault/1.0 (mailto:admin@cognivault.local)' },
        });
        if (crossrefRes.ok) {
          const data: any = await crossrefRes.json();
          const item = data.message;
          const title = Array.isArray(item.title) ? item.title[0] : (item.title || doi);
          const authors = Array.isArray(item.author)
            ? item.author.map((a: any) => `${a.family || ''}${a.given ? ', ' + a.given : ''}`).join('; ')
            : '';
          const year = item.created?.['date-parts']?.[0]?.[0] || item.published?.['date-parts']?.[0]?.[0] || '';
          const container = Array.isArray(item['container-title']) ? item['container-title'][0] : '';
          const url = item.URL || `https://doi.org/${doi}`;
          const abstract = item.abstract ? item.abstract.replace(/<[^>]+>/g, '').slice(0, 300) : '';

          res.json({
            success: true,
            type: 'doi',
            citation: {
              title,
              url,
              snippet: abstract || (authors ? `${authors} (${year}). ${container}. DOI: ${doi}` : `Scholarly publication ${doi}`),
              author: authors,
              year: String(year),
              journal: container,
              doi,
            },
          });
          return;
        }
      } catch (e) {
        console.warn('Crossref lookup error:', e);
      }
    }

    // Attempt Gemini or heuristic fallback
    res.json({
      success: true,
      type: 'heuristic',
      citation: {
        title: trimmed.slice(0, 80),
        snippet: trimmed.slice(0, 200),
      },
    });
  } catch (error: any) {
    console.error('Citation parse error:', error);
    res.status(500).json({ error: error?.message || 'Failed to parse citation input.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CogniVault adversarial server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
