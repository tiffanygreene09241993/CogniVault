# CogniVault

Adversarial research workspace for criminal justice, forensic psychology, and public administration. Draft a brief, evaluation, or policy memo, then stress-test it before opposing counsel, a peer reviewer, or an agency director does.

CogniVault is not a writing assistant. The sparring engine is instructed to skip praise, demand a falsification condition for ungrounded claims, and end every round with a clause you can insert into the draft.

## What it does

- **Dossier editor.** Markdown notes with epistemic status (`unchallenged`, `under_siege`, `resilient`), a resilience score, a falsifiability criterion, assumptions, and supporting vs. counter evidence.
- **Three sparring personas.** Hostile cross-examiner (chain of custody, Reid vs. PEACE, Daubert/Frye, 4th/5th/6th/14th Amendment), bureaucratic realist (grant cliffs, unfunded mandates, Lipsky drift), empirical criminologist (sampling bias, NIBRS/UCR ecological fallacies, calibration vs. disparity).
- **Deposition.** Three-round under-oath interrogation with a survival score.
- **Policy pre-mortem.** Three-year failure timeline for a proposal.
- **Logic lint.** Flags ungrounded assertions, fallacies, and causal leaps, each with an inoculation clause.
- **Graph, citations, export.** Contradiction/support graph, BibTeX/DOI intake, and export (including a Google Docs formatter).

Seed dossiers cover eyewitness contamination, COMPAS risk scores, and decarceration net-widening. Demo Mode in the top bar restores them.

## Persistence

Notes autosave in two places:

1. `localStorage` key `cognivault_adversarial_notes_v4` — instant cache for this browser.
2. `data/vault.json` on the server — survives restarts and is shared by every browser hitting this instance.

The client hydrates from `GET /api/vault` on load. If the server vault is empty, it keeps the local cache (or the seed dossiers) and writes that snapshot up. Later edits debounce to `PUT /api/vault` after 600ms. A status line at the bottom left reads `Vault saved` or `Local only` if the server is unreachable.

`data/vault.json` is gitignored. Do not commit case notes.

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/vault` | — |
| PUT | `/api/vault` | `{ notes, activeNoteId }` |

Limits: 200 notes, 2 MB. Each note must have string `id`, `title`, and `content`.

## Stack

React 19, Vite, Tailwind 4, Motion, Lucide, Express, `@google/genai`. `npm run dev` starts Express, which mounts the Vite middleware in development and the static build in production.

## Setup

```bash
cp .env.example .env
# set GEMINI_API_KEY
npm install
npm run dev
```

Open `http://localhost:3000`.

AI Studio injects `GEMINI_API_KEY` at runtime. Locally, put it in `.env`. Without a key, the editor and vault still work; sparring, deposition, lint, and pre-mortem return an error from Gemini.

```bash
npm run build    # client bundle
npm run lint     # tsc --noEmit
```

Production: `NODE_ENV=production npm start` serves `dist/`. Build first.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness and whether a Gemini key is set |
| GET/PUT | `/api/vault` | Note vault |
| POST | `/api/gemini/logic-lint` | In-editor logic lint |
| POST | `/api/gemini/spar-persona` | Persona sparring round |
| POST | `/api/gemini/deposition-challenge` | Deposition question or verdict |
| POST | `/api/gemini/policy-pre-mortem` | Three-year failure audit |
| POST | `/api/citations/parse` | DOI (Crossref) or raw citation intake |

Model order is `gemini-3.8-flash`, then `gemini-3.1-flash-lite`, with one retry on 429/503.

## Layout

```
server.ts                 Express + Gemini routes + Vite mount
src/server/vaultStore.ts  data/vault.json read/write
src/lib/vaultClient.ts    browser hydrate/save
src/App.tsx               note state, demo mode, autosave
src/components/           editor, sparring, deposition, graph, export
src/data/initialNotes.ts  seed dossiers
data/vault.json           runtime store (gitignored)
```

## License

Source headers use Apache-2.0.
