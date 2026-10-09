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

Writes copy the current file to `data/vault.json.bak`, then replace it with a uniquely named temp file. A corrupt vault falls back to that backup on read. `POST /api/vault/restore` copies the backup back over the live file. Notes need a unique string `id`, string `title` and `content`, optional string timestamps, at most 200 notes, 200k characters each, 2 MB total.

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

Apache-2.0. See `LICENSE`.


## Session persistence

Sparring turns, the deposition record, and the latest pre-mortem report are stored on the note as `session` and written through the same vault save. A refresh restores them. `session.sparring` is keyed by persona.

The vault file is schema version 1. Override the path with `VAULT_PATH` if the process cannot write `data/` (containers, read-only filesystems). This app is a long-running Express server, not a serverless function: a Vercel or Cloud Run instance with an ephemeral disk will lose `data/vault.json` on restart unless you mount a volume or point `VAULT_PATH` at persistent storage.

```bash
npm run smoke:vault
```

## Deploy

```bash
docker build -t cognivault .
docker run --env-file .env -p 3000:3000 -v cognivault-data:/app/data cognivault
```

The volume keeps the vault across container restarts. Set `GEMINI_API_KEY` in `.env`. Do not commit that file.

## Demo path

1. Open Demo Mode and load the eyewitness-contamination dossier. The cross-examiner is primed.
2. Open the sparring panel and send the thesis. Adopt one inoculation clause.
3. Run the deposition or the 3-year pre-mortem, then reload. The transcript and report should still be on the note.
4. Export from the top bar. That export is the artifact to show, not the file tree.
