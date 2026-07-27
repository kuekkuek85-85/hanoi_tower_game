import { NextRequest, NextResponse } from 'next/server';
import { getDb, RECORDS_COLLECTION } from '@lib/db';
import { insertHanoiRecordSchema, HanoiRecord } from '@shared/schema';
import { Timestamp } from 'firebase-admin/firestore';
import { ZodError } from 'zod';

export const dynamic = 'force-dynamic';

function docToRecord(id: string, data: FirebaseFirestore.DocumentData): HanoiRecord {
  return {
    id,
    studentId: data.studentId,
    studentName: data.studentName,
    disks: data.disks,
    moves: data.moves,
    seconds: data.seconds,
    mode: (data.mode as 'student' | 'teacher') ?? 'student',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '') || 500, 1), 500);
    const modeFilter = searchParams.get('mode'); // 'student' | 'teacher' | null

    const db = getDb();
    const snapshot = await db
      .collection(RECORDS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    let records = snapshot.docs.map(doc => docToRecord(doc.id, doc.data()));

    // 학생 studentId = 5자리 숫자, 교사 studentId = 학교명(비숫자)
    const isStudentId = (id: string) => /^\d{5}$/.test(id);

    if (modeFilter === 'teacher') {
      // mode='teacher' 이거나 mode 미설정인데 학교명 형태인 경우(기존 데이터)
      records = records.filter(r => r.mode === 'teacher' || !isStudentId(r.studentId));
    } else {
      // 학생: mode!='teacher' 이고 5자리 숫자 ID
      records = records.filter(r => r.mode !== 'teacher' && isStudentId(r.studentId));
    }

    return NextResponse.json(records);
  } catch (err) {
    console.error('[GET /api/records]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to fetch records', detail: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recordData = insertHanoiRecordSchema.parse(body);

    const minMoves = Math.pow(2, recordData.disks) - 1;
    if (recordData.moves < minMoves) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    const db = getDb();
    const docRef = await db.collection(RECORDS_COLLECTION).add({
      ...recordData,
      createdAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    const record = docToRecord(doc.id, doc.data()!);

    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}
