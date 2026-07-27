import { NextRequest, NextResponse } from 'next/server';
import { getDb, REFLECTIONS_COLLECTION } from '@lib/db';
import { Timestamp } from 'firebase-admin/firestore';
import { generateHanoiFeedback } from '@lib/gemini';

export const dynamic = 'force-dynamic';

function docToReflection(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    participantId: d.participantId as string,
    participantName: d.participantName as string,
    disks: d.disks as number,
    moves: d.moves as number,
    content: d.content as string,
    aiFeedback: (d.aiFeedback as string) ?? null,
    teacherFeedback: (d.teacherFeedback as string) ?? null,
    status: d.status as 'pending' | 'ai_done' | 'teacher_done',
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt),
    feedbackAt: d.feedbackAt instanceof Timestamp ? d.feedbackAt.toDate() : (d.feedbackAt ? new Date(d.feedbackAt) : null),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');

    const db = getDb();
    const col = db.collection(REFLECTIONS_COLLECTION);

    const snapshot = participantId
      ? await col.where('participantId', '==', participantId).orderBy('createdAt', 'desc').limit(50).get()
      : await col.orderBy('createdAt', 'desc').limit(200).get();

    return NextResponse.json(snapshot.docs.map(doc => docToReflection(doc.id, doc.data())));
  } catch (err) {
    console.error('[GET /api/reflections]', err);
    return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { participantId, participantName, disks, moves, content } = await request.json();
    if (!participantId || !participantName || !disks || !moves || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let aiFeedback: string | null = null;
    try {
      aiFeedback = await generateHanoiFeedback(content.trim(), disks, moves);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Gemini error]', msg);
      aiFeedback = `⚠️ AI 피드백 생성에 실패했습니다. (${msg}) 교사가 직접 피드백을 작성해주세요.`;
    }

    const db = getDb();
    const now = Timestamp.now();
    const docRef = await db.collection(REFLECTIONS_COLLECTION).add({
      participantId,
      participantName,
      disks,
      moves,
      content: content.trim(),
      aiFeedback,
      teacherFeedback: null,
      status: aiFeedback ? 'ai_done' : 'pending',
      createdAt: now,
      feedbackAt: null,
    });

    const doc = await docRef.get();
    return NextResponse.json(docToReflection(doc.id, doc.data()!));
  } catch (err) {
    console.error('[POST /api/reflections]', err);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}
