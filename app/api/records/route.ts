import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@lib/db';
import { hanoiRecords, insertHanoiRecordSchema } from '@shared/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const db = getDb();
    const query = db.select().from(hanoiRecords).orderBy(desc(hanoiRecords.createdAt));
    const records = limit ? await query.limit(limit) : await query;

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
    const [record] = await db.insert(hanoiRecords).values(recordData).returning();

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid data' },
      { status: 400 }
    );
  }
}
