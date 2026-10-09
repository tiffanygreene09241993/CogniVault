# CogniVault — In-App Adversarial Crucible & Sparring Agent

Transform CogniVault into an embedded adversarial crucible engineered specifically for **Criminal Justice, Forensic Psychology, and Public Administration/Policy**. This update enforces absolute zero sycophancy, domain-specific attack vectors, active epistemic friction (demanding Popperian falsification criteria), and actionable defense clause synthesis at the conclusion of every sparring and deposition round.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The in-app sparring engine will strictly conform to the following operational parameters:
> - **Zero Sycophancy Mandate**: Prompt engineering across all server endpoints (`/api/gemini/spar-persona`, `/api/gemini/deposition-challenge`, `/api/gemini/logic-lint`) will explicitly ban all introductory pleasantries, praise, or validation ("Good point", "I understand your approach", "Interesting thesis"). The opponent immediately executes clinical deconstruction.
> - **Epistemic Friction & Falsification Demands**: Ungrounded assertions trigger immediate challenges demanding explicit falsification criteria (*"What observable condition would prove this claim false?"*).
> - **Actionable Defense Clauses**: Every sparring exchange, deposition round, and logic-lint remedy concludes with **1–2 concrete defensive clauses, evidentiary safeguards, or statutory citations** that the user can immediately insert into their text to inoculate the draft against real-world courtroom, peer-review, or administrative attack.

- **Confirmed Decision 1: Personas & Domain Attack Vectors**:
  - **The Hostile Cross-Examiner (Defense/Prosecutorial Counsel)**: Attacks chain of custody, cognitive bias, suggestive interviewing (Reid vs. PEACE), witness contamination, Daubert/Frye scientific admissibility, and 4th, 5th, 6th, and 14th Amendment constitutional challenges. Incisive, clinical, courtroom-ready tone.
  - **The Bureaucratic Realist (Budget Director / City Manager / Agency Chief)**: Attacks unfunded mandates, federal grant drop-offs (Year 2/3 cliffs), collective bargaining/union pushback, administrative compliance friction, and street-level bureaucratic drift (Lipsky). Pragmatic, operational, risk-averse tone.
  - **The Empirical Criminologist (Methodological Purist / Lead Statistician)**: Attacks sampling bias, regression to the mean, ecological fallacies in NIBRS/UCR data, confounding variables, algorithmic disparity vs. calibration, and Popperian falsifiability. Academic, rigorous, data-driven tone.
- **Confirmed Decision 2: 1-Click "Inoculate Draft" Interface**:
  - Sparring turns and deposition rounds render a dedicated **"Inoculation Defense Clauses"** card with statutory citations and a 1-click **"Adopt Inoculation Clause into Draft"** button.
  - In-editor logic-linter popovers include an **"Inoculate Assertion"** action that replaces vulnerable claims with fortified phrasing and statutory references.

---

## 1. Overview & Core Concept

### What It Does
CogniVault operates as an unforgiving crucible that stress-tests briefs, evaluations, and policy proposals before the researcher faces opposing counsel, peer reviewers, or agency directors:
1. **Adversarial Sparring Arena**: Real-time back-and-forth deconstruction against the active persona with zero conversational padding.
2. **Deposition & Mock Hearing Crucible**: Rapid-fire, under-oath interrogation targeting procedural flaws and unmodeled budget cliffs.
3. **Epistemic Friction & Falsification Enforcement**: Automatically detects speculative claims and challenges the author to provide falsification criteria.
4. **Actionable Defense Clause Inoculation**: Translates every attack into ready-to-insert contractual, statutory, or evidentiary safeguards.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Selecting the Sparring Persona**: The user selects *The Hostile Cross-Examiner*, *The Bureaucratic Realist*, or *The Empirical Criminologist*.
2. **Engaging in Cross-Examination**: The persona immediately fires targeted questions attacking the weakest link (e.g. suggestive questioning under the Reid technique, or Year 2 grant cliff funding).
3. **Reviewing Actionable Inoculation Clauses**: At the conclusion of the critique, a high-contrast emerald card presents 1–2 concrete statutory defense clauses (e.g., *Model Rule 3.8 discovery covenant* or *Lipsky administrative discretion audit clause*).
4. **Inoculating the Note**: Clicking "Adopt Inoculation Clause" inserts the defensive clause directly into the active markdown text and increases the Resilience Index.
5. **Deposition Survival Scoring**: Completing the 3-minute deposition generates a judicial survival verdict with specific cross-examination survival safeguards.

### Visual Identity & Semantic Tokens
- **Crucible Palette**: Obsidian midnight canvas (`#0A0E17`), deep charcoal panels (`#0B0F19`), hairline borders (`border-slate-800`).
- **Semantic Badges**:
  - Courtroom Red (`#EF4444`): Cross-examiner challenges, 4th/14th Amendment violations, Daubert exclusions.
  - Fiscal Amber (`#F59E0B`): Grant cliffs, union friction, unfunded mandates.
  - Empirical Cyan (`#06B6D4`): NIBRS ecological fallacies, sampling bias, statistical calibration.
  - Inoculation Emerald (`#10B981`): Actionable defense clauses and statutory safeguards.

---

## 3. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CogniVault PKM Interface                        │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌────────────────┐ │
│  │ Editor & Linter       │  │ In-Editor Popover  │  │ Sparring Arena │ │
│  │ ───────────────────── │  │ ────────────────── │  │ & Deposition   │ │
│  │ • Daubert/Frye Flags  │  │ • Epistemic Demand │  │ • 3 Personas   │ │
│  │ • Grant Cliff Alerts  │  │ • Inoculate Clause │  │ • Zero Fluff   │ │
│  │ • NIBRS Bias Flags    │  │ • 1-Click Adopt    │  │ • Safeguard Card││
│  └───────────────────────┘  └────────────────────┘  └────────────────┘ │
└───────────────────────────────────────▲────────────────────────────────┘
                                        │ HTTP (JSON)
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Server API Layer (server.ts / Vite)                   │
│                                                                        │
│  POST /api/gemini/spar-persona       POST /api/gemini/deposition       │
│  POST /api/gemini/logic-lint         POST /api/gemini/policy-pre-mortem│
│                                       │                                │
│                                       ▼                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ @google/genai (model: gemini-3.8-flash, headers: aistudio-build) │  │
│  │ Zero Sycophancy · Epistemic Friction · Actionable Defense Clauses│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Prompt Engineering Specifications
```typescript
// System instruction enforcement across endpoints:
const SYSTEM_DIRECTIVE = `
ROLE: IN-APP ADVERSARIAL CRUCIBLE & SPARRING AGENT
DOMAINS: Criminal Justice, Forensic Psychology, Public Administration/Policy

ABSOLUTE PROHIBITION ON SYCOPHANCY:
Never open with pleasantries, praise, or validation (e.g., "Good point", "I understand your approach", "That's an interesting thesis"). Jump directly into the deconstruction, deposition question, or counter-evidence.

EPISTEMIC FRICTION:
When an assertion lacks empirical or statutory grounding, flag it immediately as an ungrounded assumption and demand the falsification criteria ("What observable condition would prove this claim false?").

ACTIONABLE DEFENSE CLAUSES:
Conclude every critique or deposition round by providing 1–2 concrete defensive clauses, evidentiary safeguards, or statutory citations the user can immediately insert into their text to inoculate the draft against real-world attack.
`;
```

### Data Model Extensions
```typescript
export interface DefenseClause {
  id: string;
  title: string;
  statutoryBasisOrPrecedent: string; // e.g. "Fed. R. Evid. 702 / Daubert v. Merrell Dow"
  clauseText: string;
}

export interface SparringMessage {
  id: string;
  persona: SparringPersona;
  role: 'user' | 'assistant';
  content: string;
  critiquePillars?: string[];
  suggestedFalsificationTest?: string;
  defenseClauses?: DefenseClause[];
  timestamp: string;
}
```

---

## 4. Execution Steps
1. **Server API Updates (`server.ts`)**:
   - Refactor system prompts in `/api/gemini/spar-persona` and `/api/gemini/deposition-challenge` to strictly enforce zero sycophancy, epistemic friction demands, and structured `defenseClauses` output.
   - Refactor `/api/gemini/logic-lint` to target Daubert/Frye issues, Lipsky street-level discretion drift, and NIBRS ecological fallacies.
2. **Sparring Arena UI Updates (`src/components/AICopilotPanel.tsx`)**:
   - Render structured **Inoculation Defense Clauses** cards with 1-click "Inoculate Draft" button appending the exact statutory clause into the user's note.
   - Display explicit epistemic friction callout cards when ungrounded assertions are detected.
3. **Editor Logic-Linter UI Updates (`src/components/Editor.tsx`)**:
   - Add instant "Adopt Inoculation Safeguard" action to the logic-linter popover.
4. **Verification**:
   - Verify zero-sycophancy output via test payload, run `lint_applet` and `compile_applet`.
