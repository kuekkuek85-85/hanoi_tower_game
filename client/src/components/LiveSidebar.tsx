'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface GameSession {
  id: string;
  studentId: string;
  studentName: string;
  disks: number;
  moves: number;
  status: 'playing' | 'done';
  startedAt: number;
  updatedAt: number;
}

function minMoves(disks: number) {
  return Math.pow(2, disks) - 1;
}

function rankSessions(sessions: GameSession[]): GameSession[] {
  return [...sessions].sort((a, b) => {
    // 원판 수 많을수록 → 이동수 적을수록 → 시작 빠를수록 상위
    if (a.disks !== b.disks) return b.disks - a.disks;
    if (a.moves !== b.moves) return a.moves - b.moves;
    return a.startedAt - b.startedAt;
  });
}

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-500'];
const MEDALS = ['🥇', '🥈', '🥉'];

interface LiveSidebarProps {
  currentStudentId: string;
}

export function LiveSidebar({ currentStudentId }: LiveSidebarProps) {
  const [sessions, setSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data: GameSession[] = await res.json();
          setSessions(rankSessions(data));
        }
      } catch {
        // 네트워크 오류 시 기존 데이터 유지
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-52 shrink-0 h-screen overflow-hidden border-r border-white/20 bg-black/25 backdrop-blur-sm hidden lg:flex flex-col">
      {/* 헤더 */}
      <div className="px-3 py-2.5 border-b border-white/20 bg-black/20 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-white/80 shrink-0" />
        <span className="text-xs font-bold text-white tracking-wide">실시간 순위</span>
        <span className="ml-auto text-[10px] text-white/60 bg-white/10 rounded-full px-1.5 py-0.5">
          {sessions.length}명
        </span>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-center text-white/40 text-xs pt-6">접속 중인 학생 없음</p>
        ) : (
          sessions.map((session, idx) => {
            const isMe = session.studentId === currentStudentId;
            const isPerfect = session.status === 'done' && session.moves === minMoves(session.disks);
            const rankColor = RANK_COLORS[idx] ?? 'text-white/50';

            return (
              <div
                key={session.id}
                className={`px-3 py-2 border-b border-white/10 transition-colors ${
                  isMe
                    ? 'bg-white/20 border-l-2 border-l-white'
                    : 'hover:bg-white/10'
                }`}
              >
                {/* 순위 + 이름 줄 */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-sm font-bold w-5 shrink-0 text-center leading-none ${rankColor}`}>
                    {idx < 3 ? MEDALS[idx] : idx + 1}
                  </span>
                  <span className={`text-xs font-semibold truncate flex-1 ${isMe ? 'text-white' : 'text-white/90'}`}>
                    {session.studentName}
                    {isMe && <span className="text-[9px] opacity-60 ml-0.5">(나)</span>}
                  </span>
                  {session.status === 'done' ? (
                    <Badge
                      className={`text-[9px] px-1 py-0 h-3.5 shrink-0 leading-none ${
                        isPerfect
                          ? 'bg-emerald-400 text-emerald-900'
                          : 'bg-blue-400/80 text-white'
                      }`}
                    >
                      {isPerfect ? '완벽!' : '완료'}
                    </Badge>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                  )}
                </div>

                {/* 원판·이동수 줄 */}
                <div className="flex gap-2 mt-0.5 pl-6 text-[10px] text-white/55 leading-none">
                  <span>원판 <b className="text-white/80">{session.disks}</b>개</span>
                  <span>·</span>
                  <span>
                    <b className={`${session.status === 'done' && isPerfect ? 'text-emerald-300' : 'text-white/80'}`}>
                      {session.moves}
                    </b>회
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 하단 설명 */}
      <div className="px-3 py-2 border-t border-white/10 text-[9px] text-white/35 text-center leading-tight">
        3초마다 갱신 · 원판↑ 이동↓ 우선
      </div>
    </aside>
  );
}
