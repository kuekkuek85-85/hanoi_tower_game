import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebase() {
  if (!getApps().length) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be set.');
    }
    initializeApp({ credential: cert(JSON.parse(json) as ServiceAccount) });
  }
  return getFirestore();
}

let _db: ReturnType<typeof getFirestore> | undefined;

export function getDb() {
  return (_db ??= initFirebase());
}

export const RECORDS_COLLECTION = 'hanoi_records';
