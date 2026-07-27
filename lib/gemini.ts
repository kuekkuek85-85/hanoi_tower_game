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

  const prompt = `당신은 컴퓨터 교육 전문가입니다. 교사가 하노이 타워 문제의 알고리즘을 자연어로 설명한 내용에 한국어로 피드백을 제공해주세요.

[게임 정보]
원판 수: ${disks}개 | 이동 횟수: ${moves}회 | 최소 이동: ${minMoves}회

[교사가 작성한 알고리즘 설명]
${content}

다음 세 가지 항목으로 피드백을 작성해주세요:

✅ 잘 이해한 부분
(교사가 정확하게 이해하거나 잘 표현한 내용)

💡 보완할 점
(더 명확하게 표현하거나 보완이 필요한 부분)

📚 핵심 알고리즘 정리
(하노이 타워 재귀 알고리즘의 핵심 — n개 원판을 C로 옮기려면: ① n-1개를 B로, ② 가장 큰 것을 C로, ③ n-1개를 B에서 C로)`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
