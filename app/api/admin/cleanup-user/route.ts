import { NextRequest, NextResponse } from 'next/server';
import { getDb, RECORDS_COLLECTION, REFLECTIONS_COLLECTION } from '@lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { password, studentName } = await request.json();
  if (password !== '123456' || !studentName) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  let deletedRecords = 0;
  let deletedReflections = 0;

  const recordsSnap = await db.collection(RECORDS_COLLECTION)
    .where('studentName', '==', studentName).get();
  for (const doc of recordsSnap.docs) {
    await doc.ref.delete();
    deletedRecords++;
  }

  const reflectionsSnap = await db.collection(REFLECTIONS_COLLECTION)
    .where('participantName', '==', studentName).get();
  for (const doc of reflectionsSnap.docs) {
    await doc.ref.delete();
    deletedReflections++;
  }

  return NextResponse.json({ deletedRecords, deletedReflections });
}
