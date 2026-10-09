import { DocumentNote, NoteSession } from '../types';

export function withSession(note: DocumentNote, patch: Partial<NoteSession>): DocumentNote {
  return {
    ...note,
    session: {
      ...note.session,
      ...patch,
      sparring: patch.sparring
        ? { ...note.session?.sparring, ...patch.sparring }
        : note.session?.sparring,
    },
    updatedAt: new Date().toISOString(),
  };
}
