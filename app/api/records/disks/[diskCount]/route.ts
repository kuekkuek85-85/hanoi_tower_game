import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@lib/db';
import { hanoiRecords } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

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
    const records = await db
      .select()
      .from(hanoiRecords)
      .where(eq(hanoiRecords.disks, diskCount))
      .orderBy(hanoiRecords.moves, hanoiRecords.seconds)
      .limit(limit);

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch records by disk count' }, { status: 500 });
  }
}
