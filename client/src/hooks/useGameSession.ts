import { useEffect, useRef } from 'react';

export function useGameSession(
  studentId: string,
  studentName: string,
  disks: number,
  moves: number,
  completed: boolean,
  startedAt: number | null,
): React.MutableRefObject<string | null> {
  const sessionIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return sessionIdRef;
}
