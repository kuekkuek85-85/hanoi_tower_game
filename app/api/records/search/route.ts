import { NextRequest, NextResponse } from 'next/server';
import { getDb, RECORDS_COLLECTION } from '@lib/db';
import { HanoiRecord } from '@shared/schema';
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
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const db = getDb();
    const snapshot = await db.collection(RECORDS_COLLECTION).get();
    const q = query.toLowerCase();

    const records = snapshot.docs
      .map(doc => docToRecord(doc.id, doc.data()))
      .filter(r =>
        r.studentId.includes(query) ||
        r.studentName.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
