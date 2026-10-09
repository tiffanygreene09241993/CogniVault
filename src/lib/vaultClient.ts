import { DocumentNote } from '../types';

export interface VaultSnapshot {
  notes: DocumentNote[];
  activeNoteId: string | null;
  updatedAt?: string;
}

function isNote(value: unknown): value is DocumentNote {
  if (!value || typeof value !== 'object') return false;
  const note = value as DocumentNote;
  return typeof note.id === 'string' && typeof note.title === 'string' && Array.isArray(note.supportingPillars);
}

export async function loadVault(): Promise<VaultSnapshot | null> {
  try {
    const response = await fetch('/api/vault');
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data?.notes)) return null;
    const notes = data.notes.filter(isNote);
    if (notes.length === 0) return null;
    return {
      notes,
      activeNoteId: typeof data.activeNoteId === 'string' ? data.activeNoteId : null,
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    };
  } catch (error) {
    console.warn('Vault hydrate failed, using local cache:', error);
    return null;
  }
}

export async function saveVault(snapshot: VaultSnapshot): Promise<boolean> {
  try {
    const response = await fetch('/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: snapshot.notes,
        activeNoteId: snapshot.activeNoteId,
      }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Vault save failed, local cache still updated:', error);
    return false;
  }
}
