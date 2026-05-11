import Dexie, { type Table } from 'dexie';
import type { Session } from '../types';

class AppDatabase extends Dexie {
  sessions!: Table<Session, number>;

  constructor() {
    super('BeforeAfterDB');
    this.version(1).stores({
      sessions: '++id, customerName, createdAt',
    });
  }
}

export const db = new AppDatabase();
