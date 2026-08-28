import { NextRequest, NextResponse } from 'next/server';
import { getDb, TRAINING_COLLECTION } from '@lib/db';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const MAX_PARTICIPANTS = 15;

export async function GET() {
  try {
    const db = getDb();
    const snapshot = await db.collection(TRAINING_COLLECTION).get();
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      school: doc.data().school as string,
      name: doc.data().name as string,
      joinedAt: doc.data().joinedAt instanceof Timestamp
        ? doc.data().joinedAt.toMillis()
        : Number(doc.data().joinedAt),
    }));
    return NextResponse.json({ participants, count: participants.length, max: MAX_PARTICIPANTS });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { school, name } = await request.json();
    if (!school?.trim() || !name?.trim()) {
      return NextResponse.json({ error: '학교명과 이름을 입력해주세요.' }, { status: 400 });
    }

    const db = getDb();
    const snapshot = await db.collection(TRAINING_COLLECTION).get();

    if (snapshot.size >= MAX_PARTICIPANTS) {
      return NextResponse.json(
        { error: `참가 인원이 최대(${MAX_PARTICIPANTS}명)에 도달했습니다.` },
        { status: 409 }
      );
    }

    // 중복 참가 확인
    const existing = snapshot.docs.find(
      doc => doc.data().school === school.trim() && doc.data().name === name.trim()
    );
    if (existing) {
      return NextResponse.json({ id: existing.id, alreadyJoined: true });
    }

    const docRef = await db.collection(TRAINING_COLLECTION).add({
      school: school.trim(),
      name: name.trim(),
      joinedAt: Timestamp.now(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch {
    return NextResponse.json({ error: 'Failed to join training' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const db = getDb();
    await db.collection(TRAINING_COLLECTION).doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to leave training' }, { status: 500 });
  }
}
