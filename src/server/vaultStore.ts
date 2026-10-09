import fs from 'fs';
import path from 'path';

export interface VaultFile {
  notes: unknown[];
  activeNoteId: string | null;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const VAULT_PATH = path.join(DATA_DIR, 'vault.json');
const MAX_BYTES = 2_000_000;
const MAX_NOTES = 200;

function emptyVault(): VaultFile {
  return { notes: [], activeNoteId: null, updatedAt: new Date(0).toISOString() };
}

export function readVault(): VaultFile & { source: 'file' | 'empty' } {
  try {
    if (!fs.existsSync(VAULT_PATH)) {
      return { ...emptyVault(), source: 'empty' };
    }
    const raw = fs.readFileSync(VAULT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const notes = Array.isArray(parsed?.notes) ? parsed.notes : [];
    return {
      notes,
      activeNoteId: typeof parsed?.activeNoteId === 'string' ? parsed.activeNoteId : null,
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
      source: notes.length > 0 ? 'file' : 'empty',
    };
  } catch (error) {
    console.warn('Vault file unreadable, returning empty vault:', error);
    return { ...emptyVault(), source: 'empty' };
  }
}

export function writeVault(body: unknown): VaultFile {
  if (!body || typeof body !== 'object') {
    const err = new Error('Vault body must be an object.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  const record = body as { notes?: unknown; activeNoteId?: unknown };
  if (!Array.isArray(record.notes)) {
    const err = new Error('notes must be an array.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  if (record.notes.length > MAX_NOTES) {
    const err = new Error(`Vault is limited to ${MAX_NOTES} notes.`);
    (err as Error & { statusCode?: number }).statusCode = 413;
    throw err;
  }
  for (const note of record.notes) {
    if (!note || typeof note !== 'object') {
      const err = new Error('Each note must be an object.');
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
    const n = note as { id?: unknown; title?: unknown; content?: unknown };
    if (typeof n.id !== 'string' || typeof n.title !== 'string' || typeof n.content !== 'string') {
      const err = new Error('Each note needs string id, title, and content.');
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
  }

  const next: VaultFile = {
    notes: record.notes,
    activeNoteId: typeof record.activeNoteId === 'string' ? record.activeNoteId : null,
    updatedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(next, null, 2);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BYTES) {
    const err = new Error('Vault payload exceeds 2 MB.');
    (err as Error & { statusCode?: number }).statusCode = 413;
    throw err;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${VAULT_PATH}.tmp`;
  fs.writeFileSync(tmp, serialized, 'utf8');
  fs.renameSync(tmp, VAULT_PATH);
  return next;
}
