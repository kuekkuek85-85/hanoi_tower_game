import { NextRequest, NextResponse } from 'next/server';
import { getDb, RECORDS_COLLECTION } from '@lib/db';
import { insertHanoiRecordSchema, HanoiRecord } from '@shared/schema';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function docToRecord(id: string, data: FirebaseFirestore.DocumentData): HanoiRecord {
  return {
    id,
    studentId: data.studentId,
    studentName: data.studentName,
    disks: data.disks,
    moves: data.moves,
    seconds: data.seconds,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const db = getDb();
    let query = db.collection(RECORDS_COLLECTION).orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
    if (limit) query = query.limit(limit);

    const snapshot = await query.get();
    const records = snapshot.docs.map(doc => docToRecord(doc.id, doc.data()));

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recordData = insertHanoiRecordSchema.parse(body);

    const db = getDb();
    const docRef = await db.collection(RECORDS_COLLECTION).add({
      ...recordData,
      createdAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    const record = docToRecord(doc.id, doc.data()!);

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid data' },
      { status: 400 }
    );
  }
}
