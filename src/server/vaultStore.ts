import fs from 'fs';
import path from 'path';
import { HttpError } from './validate';

export interface VaultFile {
  schemaVersion: 1;
  notes: unknown[];
  activeNoteId: string | null;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const MAX_BYTES = 2_000_000;
const MAX_NOTES = 200;
const MAX_NOTE_CHARS = 200_000;

function vaultPath(): string {
  return process.env.VAULT_PATH || path.join(DATA_DIR, 'vault.json');
}

function backupPath(): string {
  return `${vaultPath()}.bak`;
}

function emptyVault(): VaultFile {
  return { schemaVersion: 1, notes: [], activeNoteId: null, updatedAt: new Date(0).toISOString() };
}

function parseVault(raw: string): VaultFile {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.notes)) {
    throw new Error('Vault JSON is not a notes array.');
  }
  return {
    schemaVersion: 1,
    notes: parsed.notes,
    activeNoteId: typeof parsed.activeNoteId === 'string' ? parsed.activeNoteId : null,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
  };
}

export function readVault(): VaultFile & { source: 'file' | 'backup' | 'empty' } {
  const target = vaultPath();
  if (!fs.existsSync(target)) return { ...emptyVault(), source: 'empty' };
  try {
    return { ...parseVault(fs.readFileSync(target, 'utf8')), source: 'file' };
  } catch (error) {
    console.warn('Vault file unreadable, trying backup:', error);
    if (fs.existsSync(backupPath())) {
      try {
        const restored = parseVault(fs.readFileSync(backupPath(), 'utf8'));
        return { ...restored, source: 'backup' };
      } catch (backupError) {
        console.warn('Vault backup unreadable:', backupError);
      }
    }
    return { ...emptyVault(), source: 'empty' };
  }
}

function validateNotes(notes: unknown[]): void {
  if (notes.length > MAX_NOTES) throw new HttpError(413, `Vault is limited to ${MAX_NOTES} notes.`);
  const ids = new Set<string>();
  for (const note of notes) {
    if (!note || typeof note !== 'object') throw new HttpError(400, 'Each note must be an object.');
    const n = note as Record<string, unknown>;
    if (typeof n.id !== 'string' || !n.id.trim()) throw new HttpError(400, 'Each note needs a string id.');
    if (ids.has(n.id)) throw new HttpError(400, `Duplicate note id: ${n.id}`);
    ids.add(n.id);
    if (typeof n.title !== 'string') throw new HttpError(400, `Note ${n.id} needs a string title.`);
    if (typeof n.content !== 'string') throw new HttpError(400, `Note ${n.id} needs string content.`);
    if (n.content.length > MAX_NOTE_CHARS) throw new HttpError(413, `Note ${n.id} exceeds ${MAX_NOTE_CHARS} characters.`);
    if (n.createdAt != null && typeof n.createdAt !== 'string') throw new HttpError(400, `Note ${n.id} createdAt must be a string.`);
    if (n.updatedAt != null && typeof n.updatedAt !== 'string') throw new HttpError(400, `Note ${n.id} updatedAt must be a string.`);
  }
}

function writeAtomic(target: string, serialized: string): void {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) fs.copyFileSync(target, backupPath());
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, serialized, 'utf8');
  fs.renameSync(tmp, target);
}

export function writeVault(body: unknown): VaultFile {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Vault body must be an object.');
  }
  const record = body as { notes?: unknown; activeNoteId?: unknown };
  if (!Array.isArray(record.notes)) throw new HttpError(400, 'notes must be an array.');
  validateNotes(record.notes);
  if (record.activeNoteId != null && typeof record.activeNoteId !== 'string') {
    throw new HttpError(400, 'activeNoteId must be a string or null.');
  }
  const ids = new Set(record.notes.map((n) => (n as { id: string }).id));
  if (typeof record.activeNoteId === 'string' && record.notes.length > 0 && !ids.has(record.activeNoteId)) {
    throw new HttpError(400, 'activeNoteId does not match a note.');
  }

  const next: VaultFile = {
    schemaVersion: 1,
    notes: record.notes,
    activeNoteId: typeof record.activeNoteId === 'string' ? record.activeNoteId : null,
    updatedAt: new Date().toISOString(),
  };
  const serialized = JSON.stringify(next, null, 2);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BYTES) throw new HttpError(413, 'Vault payload exceeds 2 MB.');
  writeAtomic(vaultPath(), serialized);
  return next;
}

export function restoreVaultBackup(): VaultFile {
  if (!fs.existsSync(backupPath())) throw new HttpError(404, 'No vault backup to restore.');
  const restored = parseVault(fs.readFileSync(backupPath(), 'utf8'));
  writeAtomic(vaultPath(), JSON.stringify(restored, null, 2));
  return restored;
}
