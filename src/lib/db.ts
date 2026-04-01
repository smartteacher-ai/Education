import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SourceMaterial } from '../types';

interface EduVoiceDB extends DBSchema {
  sourceMaterials: {
    key: string;
    value: SourceMaterial;
    indexes: { 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<EduVoiceDB>>;

export async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<EduVoiceDB>('eduvoice-db-v2', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sourceMaterials', {
          keyPath: 'id',
        });
        store.createIndex('by-date', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function saveSourceMaterial(material: SourceMaterial) {
  const db = await initDB();
  await db.put('sourceMaterials', material);
}

export async function getSourceMaterial(id: string): Promise<SourceMaterial | undefined> {
  const db = await initDB();
  return db.get('sourceMaterials', id);
}

export async function getAllSourceMaterials(): Promise<SourceMaterial[]> {
  const db = await initDB();
  return db.getAllFromIndex('sourceMaterials', 'by-date');
}

export async function deleteSourceMaterial(id: string) {
  const db = await initDB();
  await db.delete('sourceMaterials', id);
}
