import Dexie, { type Table } from 'dexie';

interface SavedReference {
  id?: number;
  image: Blob;
  savedAt: Date;
}

class AppDatabase extends Dexie {
  savedReferences!: Table<SavedReference, number>;

  constructor() {
    super('BeforeAfterDB');
    this.version(1).stores({
      sessions: '++id, customerName, createdAt',
    });
    this.version(2).stores({
      sessions: '++id, customerName, createdAt',
      savedReferences: '++id',
    });
  }
}

export const db = new AppDatabase();

export async function saveReferenceImage(blob: Blob): Promise<void> {
  await db.savedReferences.clear();
  await db.savedReferences.add({ image: blob, savedAt: new Date() });
}

export async function loadReferenceImage(): Promise<Blob | null> {
  const entry = await db.savedReferences.toCollection().first();
  return entry?.image ?? null;
}

export async function clearReferenceImage(): Promise<void> {
  await db.savedReferences.clear();
}
