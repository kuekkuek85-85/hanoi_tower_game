import { useEffect, useRef } from 'react';

export function useGameSession(
  studentId: string,
  studentName: string,
  disks: number,
  moves: number,
  completed: boolean,
  startedAt: number | null, // 새 게임/재시작마다 바뀌어 세션 재생성 트리거
) {
  const sessionIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 게임 시작(또는 재시작) 시 새 세션 생성
  useEffect(() => {
    if (!startedAt || !studentId) return;
    sessionIdRef.current = null;

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, studentName, disks }),
    })
      .then(r => r.json())
      .then(data => { sessionIdRef.current = data.id ?? null; })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt]);

  // 이동수 변경 시 세션 업데이트 (완료 즉시, 그 외 2초 debounce)
  useEffect(() => {
    if (!sessionIdRef.current) return;

    const send = () => {
      fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionIdRef.current,
          moves,
          status: completed ? 'done' : 'playing',
        }),
      }).catch(() => {});
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (completed) {
      send();
    } else {
      debounceRef.current = setTimeout(send, 2000);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [moves, completed]);
}
