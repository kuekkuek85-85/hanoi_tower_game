import { NextRequest, NextResponse } from 'next/server';
import { getDb, RECORDS_COLLECTION, SESSIONS_COLLECTION } from '@lib/db';
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

const isStudentId = (id: string) => /^\d{5}$/.test(id);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '') || 500, 1), 500);
    const modeFilter = searchParams.get('mode');

    const db = getDb();
    const snapshot = await db
      .collection(RECORDS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    let records = snapshot.docs.map(doc => docToRecord(doc.id, doc.data()));

    if (modeFilter === 'teacher') {
      records = records.filter(r => r.mode === 'teacher' || !isStudentId(r.studentId));
    } else if (modeFilter === 'student') {
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

    // [검증 1] 이동수 대비 최소 소요 시간 — 이동당 최소 0.3초
    const minSeconds = Math.ceil(recordData.moves * 0.3);
    if (recordData.seconds < minSeconds) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // [검증 2] 세션 토큰 검증 — 실제 게임 플레이 확인
    const db = getDb();
    if (recordData.sessionId) {
      const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(recordData.sessionId).get();
      if (!sessionDoc.exists) {
        return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
      }
      const s = sessionDoc.data()!;
      const sessionStudentId = s.studentId as string;
      const sessionDisks = s.disks as number;
      const sessionStartedAt = s.startedAt instanceof Timestamp ? s.startedAt.toMillis() : Number(s.startedAt);
      const sessionStatus = s.status as string;

      // 세션의 studentId·disks가 제출 데이터와 일치해야 함
      if (sessionStudentId !== recordData.studentId || sessionDisks !== recordData.disks) {
        return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
      }
      // 세션이 완료 상태여야 함
      if (sessionStatus !== 'done') {
        return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
      }
      // 제출된 seconds가 세션 시작 이후 실제 경과 시간의 2배를 초과하면 조작 의심
      const sessionElapsedSeconds = Math.floor((Date.now() - sessionStartedAt) / 1000);
      if (recordData.seconds > sessionElapsedSeconds * 2 + 60) {
        return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
      }
    } else {
      // sessionId 없이는 제출 불가
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    const { sessionId: _sid, ...recordToSave } = recordData;
    const docRef = await db.collection(RECORDS_COLLECTION).add({
      ...recordToSave,
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
