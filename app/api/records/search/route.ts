import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@lib/db';
import { hanoiRecords } from '@shared/schema';
import { or, ilike, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const db = getDb();
    const records = await db
      .select()
      .from(hanoiRecords)
      .where(
        or(
          ilike(hanoiRecords.studentId, `%${query}%`),
          ilike(hanoiRecords.studentName, `%${query}%`)
        )
      )
      .orderBy(desc(hanoiRecords.createdAt));

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
