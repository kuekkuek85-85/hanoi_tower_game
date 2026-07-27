import { NextRequest, NextResponse } from 'next/server';
import { getDb, REFLECTIONS_COLLECTION } from '@lib/db';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { teacherFeedback } = await request.json();
    const { id } = params;

    if (!id || teacherFeedback === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    await db.collection(REFLECTIONS_COLLECTION).doc(id).update({
      teacherFeedback: teacherFeedback.trim(),
      status: 'teacher_done',
      feedbackAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/reflections]', err);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
