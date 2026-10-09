import fs from 'fs';
import os from 'os';
import path from 'path';
import { readVault, writeVault } from '../src/server/vaultStore';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cognivault-vault-'));
process.env.VAULT_PATH = path.join(dir, 'vault.json');

const empty = readVault();
if (empty.source !== 'empty' || empty.notes.length !== 0) {
  throw new Error('expected empty vault');
}

const saved = writeVault({
  notes: [{ id: 'note-smoke', title: 'Smoke', content: 'falsify me', session: { preMortem: { analyzedAt: '2026-10-09' } } }],
  activeNoteId: 'note-smoke',
});
if (saved.notes.length !== 1) throw new Error('write failed');

const loaded = readVault();
const note = loaded.notes[0] as { session?: { preMortem?: { analyzedAt?: string } } };
if (loaded.activeNoteId !== 'note-smoke' || note.session?.preMortem?.analyzedAt !== '2026-10-09') {
  throw new Error('session did not round-trip');
}

let rejected = false;
try {
  writeVault({ notes: [{ id: 1 }] });
} catch {
  rejected = true;
}
if (!rejected) throw new Error('invalid note was accepted');

console.log('vault smoke ok', process.env.VAULT_PATH);
