import fs from 'fs';
import os from 'os';
import path from 'path';
import { readVault, restoreVaultBackup, writeVault } from '../src/server/vaultStore';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cognivault-vault-'));
process.env.VAULT_PATH = path.join(dir, 'vault.json');

const note = {
  id: 'note-smoke',
  title: 'Smoke',
  content: 'falsify me',
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
  session: { preMortem: { analyzedAt: '2026-10-09' } },
};

if (readVault().source !== 'empty') throw new Error('expected empty vault');
writeVault({ notes: [note], activeNoteId: 'note-smoke' });
writeVault({ notes: [{ ...note, title: 'Smoke v2' }], activeNoteId: 'note-smoke' });

const loaded = readVault();
if (loaded.source !== 'file' || (loaded.notes[0] as { title: string }).title !== 'Smoke v2') {
  throw new Error('round-trip failed');
}
if (!fs.existsSync(`${process.env.VAULT_PATH}.bak`)) throw new Error('backup was not written');

fs.writeFileSync(process.env.VAULT_PATH, '{not json');
const fromBackup = readVault();
if (fromBackup.source !== 'backup') throw new Error('corrupt vault did not fall back to backup');
restoreVaultBackup();
if (readVault().source !== 'file') throw new Error('restore did not rewrite the vault');

for (const bad of [
  { notes: [{ id: 1 }] },
  { notes: [note, { ...note }] },
  { notes: [note], activeNoteId: 'missing' },
]) {
  let rejected = false;
  try { writeVault(bad); } catch { rejected = true; }
  if (!rejected) throw new Error(`accepted bad payload ${JSON.stringify(bad).slice(0, 80)}`);
}

console.log('vault smoke ok', process.env.VAULT_PATH);
