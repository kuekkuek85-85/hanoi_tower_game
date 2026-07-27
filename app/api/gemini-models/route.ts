import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
