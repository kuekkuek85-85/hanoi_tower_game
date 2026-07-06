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

export async function GET(
  request: NextRequest,
  { params }: { params: { diskCount: string } }
) {
  try {
    const diskCount = parseInt(params.diskCount);
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    if (diskCount < 3 || diskCount > 10) {
      return NextResponse.json(
        { error: 'Disk count must be between 3 and 10' },
        { status: 400 }
      );
    }

    const db = getDb();
    const snapshot = await db
      .collection(RECORDS_COLLECTION)
      .where('disks', '==', diskCount)
      .get();

    const records = snapshot.docs
      .map(doc => docToRecord(doc.id, doc.data()))
      .sort((a, b) => a.moves - b.moves || a.seconds - b.seconds)
      .slice(0, limit);

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records by disk count' }, { status: 500 });
  }
}
