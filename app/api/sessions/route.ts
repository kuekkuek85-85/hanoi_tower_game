import { NextRequest, NextResponse } from 'next/server';
import { getDb, SESSIONS_COLLECTION } from '@lib/db';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5분 이내 업데이트된 세션만 노출

export async function GET() {
  try {
    const db = getDb();
    const cutoff = Timestamp.fromMillis(Date.now() - ACTIVE_WINDOW_MS);
    const snapshot = await db
      .collection(SESSIONS_COLLECTION)
      .where('updatedAt', '>', cutoff)
      .get();

    // studentId 기준 최신 세션만 유지 (중복 제거 안전망)
    const latestByStudent = new Map<string, { doc: FirebaseFirestore.QueryDocumentSnapshot; updatedAt: number }>();
    for (const doc of snapshot.docs) {
      const d = doc.data();
      const updatedAt = d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Number(d.updatedAt);
      const existing = latestByStudent.get(d.studentId);
      if (!existing || updatedAt > existing.updatedAt) {
        latestByStudent.set(d.studentId, { doc, updatedAt });
      }
    }

    const sessions = Array.from(latestByStudent.values()).map(({ doc }) => {
      const d = doc.data();
      return {
        id: doc.id,
        studentId: d.studentId as string,
        studentName: d.studentName as string,
        disks: d.disks as number,
        moves: d.moves as number,
        status: d.status as 'playing' | 'done',
        startedAt: d.startedAt instanceof Timestamp ? d.startedAt.toMillis() : Number(d.startedAt),
        updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Number(d.updatedAt),
      };
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, studentName, disks } = await request.json();
    if (!studentId || !studentName || !disks) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const db = getDb();
    const now = Timestamp.now();

    // studentId로 기존 세션 검색 → 있으면 upsert, 없으면 신규 생성
    const existing = await db
      .collection(SESSIONS_COLLECTION)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    let sessionId: string;

    if (!existing.empty) {
      sessionId = existing.docs[0].id;
      await db.collection(SESSIONS_COLLECTION).doc(sessionId).update({
        studentName,
        disks,
        moves: 0,
        status: 'playing',
        startedAt: now,
        updatedAt: now,
      });
    } else {
      const docRef = await db.collection(SESSIONS_COLLECTION).add({
        studentId,
        studentName,
        disks,
        moves: 0,
        status: 'playing',
        startedAt: now,
        updatedAt: now,
      });
      sessionId = docRef.id;
    }

    return NextResponse.json({ id: sessionId });
  } catch {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// 중복 세션 일괄 삭제 (일회성 정리용, 교사 비밀번호 필요)
export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (password !== '123456') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const snapshot = await db.collection(SESSIONS_COLLECTION).get();

    // studentId 기준 최신 문서 1개 제외하고 나머지 수집
    const latestByStudent = new Map<string, { id: string; updatedAt: number }>();
    for (const doc of snapshot.docs) {
      const d = doc.data();
      const updatedAt = d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : Number(d.updatedAt);
      const existing = latestByStudent.get(d.studentId);
      if (!existing || updatedAt > existing.updatedAt) {
        latestByStudent.set(d.studentId, { id: doc.id, updatedAt });
      }
    }

    const keepIds = new Set(Array.from(latestByStudent.values()).map(v => v.id));
    const toDelete = snapshot.docs.filter(doc => !keepIds.has(doc.id));

    // Firestore 배치 삭제 (최대 500개씩)
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += 500) {
      const batch = db.batch();
      toDelete.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      deleted += Math.min(500, toDelete.length - i);
    }

    return NextResponse.json({ deleted, kept: keepIds.size });
  } catch {
    return NextResponse.json({ error: 'Failed to cleanup sessions' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, moves, status } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const db = getDb();
    await db.collection(SESSIONS_COLLECTION).doc(id).update({
      moves: moves ?? 0,
      status: status ?? 'playing',
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
