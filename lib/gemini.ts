import 'server-only';

export async function generateHanoiFeedback(
  content: string,
  disks: number,
  moves: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '[GEMINI_API_KEY 미설정 — Vercel 환경변수에 GEMINI_API_KEY를 추가해주세요]';
  }

  const minMoves = Math.pow(2, disks) - 1;

  const prompt = `당신은 컴퓨터 교육 전문가입니다. 교사가 작성한 하노이 타워 알고리즘 설명에 간결한 한국어 피드백을 작성하세요.

[게임 정보] 원판 ${disks}개 | 이동 ${moves}회 | 최소 ${minMoves}회

[교사 풀이]
${content}

아래 형식으로 작성하되, 각 항목은 1~2문장으로 핵심만 쓰세요. 전체 10줄을 넘지 마세요.

✅ 잘 이해한 부분
💡 보완할 점
📚 핵심 정리 (n개 이동 = ①n-1개→B ②최대→C ③n-1개→C)`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini 응답 파싱 실패: ${JSON.stringify(data)}`);
  }
  return text;
}
