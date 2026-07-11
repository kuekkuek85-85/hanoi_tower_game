'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy } from 'lucide-react';
import { HanoiRecord } from '@shared/schema';

// ── 학번에서 반 번호 추출 ─────────────────────────────────
// 학번 형식: GCCNN (G=학년, CC=반 01~08, NN=번호)
// 예: 10101 → 반="01"=1반, 10801 → 반="08"=8반
function getClassNum(studentId: string): number {
  return parseInt(studentId.substring(1, 3)) || 0;
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}분 ${s.toString().padStart(2, '0')}초`;
}

function minMoves(disks: number) {
  return Math.pow(2, disks) - 1;
}

function isBetter(a: HanoiRecord, b: HanoiRecord): boolean {
  if (a.disks !== b.disks) return a.disks > b.disks;
  if (a.moves !== b.moves) return a.moves < b.moves;
  return a.seconds < b.seconds;
}

// ── 학생별 요약 ───────────────────────────────────────────
interface StudentSummary {
  studentId: string;
  studentName: string;
  bestRecord: HanoiRecord;
  allRecords: HanoiRecord[];
  attempts: number;
  totalSeconds: number;
}

function buildSummaries(records: HanoiRecord[]): Map<string, StudentSummary> {
  const map = new Map<string, StudentSummary>();
  records.forEach(r => {
    const cur = map.get(r.studentId);
    if (!cur) {
      map.set(r.studentId, {
        studentId: r.studentId,
        studentName: r.studentName,
        bestRecord: r,
        allRecords: [r],
        attempts: 1,
        totalSeconds: r.seconds,
      });
    } else {
      cur.allRecords.push(r);
      cur.attempts++;
      cur.totalSeconds += r.seconds;
      if (isBetter(r, cur.bestRecord)) cur.bestRecord = r;
    }
  });
  return map;
}

// ── 특별상 계산 ───────────────────────────────────────────
interface SpecialAward {
  icon: string;
  title: string;
  subtitle: string;
  studentName: string;
  detail: string;
  gradient: string;
}

// 1등 수상자가 특별상에 중복으로 몰리지 않도록, top1을 제외한 후보 중 선발
// 대체자가 없을 때만 top1에게도 수여
function pickWinner(
  sorted: StudentSummary[],
  top1Id: string
): StudentSummary | null {
  if (sorted.length === 0) return null;
  const nonTop1 = sorted.filter(s => s.studentId !== top1Id);
  return nonTop1.length > 0 ? nonTop1[0] : sorted[0];
}

function computeAwards(map: Map<string, StudentSummary>, top1Id: string): SpecialAward[] {
  const students = Array.from(map.values());
  if (students.length === 0) return [];

  const awards: SpecialAward[] = [];

  // 1. 📈 성장왕: 같은 원판 수 기준 최악 기록 → 최고 기록 이동수 차이 최대
  {
    type Entry = { s: StudentSummary; gap: number; worstMoves: number; bestMoves: number; disks: number };
    const entries: Entry[] = [];
    students.forEach(s => {
      if (s.attempts < 2) return;
      // 원판 수별로 그룹
      const byDisks = new Map<number, HanoiRecord[]>();
      s.allRecords.forEach(r => {
        const list = byDisks.get(r.disks) ?? [];
        list.push(r);
        byDisks.set(r.disks, list);
      });
      byDisks.forEach((recs, disks) => {
        if (recs.length < 2) return;
        const worstMoves = Math.max(...recs.map(r => r.moves));
        const bestMoves  = Math.min(...recs.map(r => r.moves));
        const gap = worstMoves - bestMoves;
        if (gap > 0) entries.push({ s, gap, worstMoves, bestMoves, disks });
      });
    });
    entries.sort((a, b) => b.gap - a.gap);
    // 학생 중복 제거(한 학생의 최대 gap만 남김)
    const seen = new Set<string>();
    const unique: Entry[] = [];
    entries.forEach(e => { if (!seen.has(e.s.studentId)) { seen.add(e.s.studentId); unique.push(e); } });
    const top = unique.filter(e => e.s.studentId !== top1Id)[0] ?? unique[0];
    if (top) {
      awards.push({
        icon: '📈', title: '성장왕', subtitle: '가장 크게 실력이 늘었어요!',
        studentName: top.s.studentName,
        detail: `원판 ${top.disks}개: ${top.worstMoves}회 → ${top.bestMoves}회 (${top.gap}회 개선!)`,
        gradient: 'from-emerald-400 to-green-500',
      });
    }
  }

  // 2. 💪 끈기왕: 총 게임 횟수 최다
  {
    const sorted = [...students].sort((a, b) => b.attempts - a.attempts);
    const w = pickWinner(sorted.filter(s => s.attempts >= 2), top1Id);
    if (w) {
      awards.push({
        icon: '💪', title: '끈기왕', subtitle: '포기를 모르는 정신력!',
        studentName: w.studentName, detail: `총 ${w.attempts}번 도전!`,
        gradient: 'from-orange-400 to-red-500',
      });
    }
  }

  // 3. ⚡ 속도왕: 원판 3개 최속 완성
  {
    type T3 = { s: StudentSummary; sec: number };
    const pool: T3[] = [];
    students.forEach(s => {
      const recs3 = s.allRecords.filter(r => r.disks === 3);
      if (recs3.length === 0) return;
      pool.push({ s, sec: Math.min(...recs3.map(r => r.seconds)) });
    });
    pool.sort((a, b) => a.sec - b.sec);
    const top = pool.filter(e => e.s.studentId !== top1Id)[0] ?? pool[0];
    if (top) {
      awards.push({
        icon: '⚡', title: '속도왕', subtitle: '원판 3개 가장 빠르게 완성!',
        studentName: top.s.studentName, detail: `${fmtTime(top.sec)} 만에 완성!`,
        gradient: 'from-yellow-400 to-amber-500',
      });
    }
  }

  // 4. ⏱️ 집중왕: 원판 5개 이하 중 단일 게임 최장 시간
  {
    type T5 = { s: StudentSummary; sec: number; disks: number };
    const pool: T5[] = [];
    students.forEach(s => {
      const recsLE5 = s.allRecords.filter(r => r.disks <= 5);
      if (recsLE5.length === 0) return;
      const longest = recsLE5.reduce((a, b) => a.seconds > b.seconds ? a : b);
      pool.push({ s, sec: longest.seconds, disks: longest.disks });
    });
    pool.sort((a, b) => b.sec - a.sec);
    const top = pool.filter(e => e.s.studentId !== top1Id)[0] ?? pool[0];
    if (top) {
      awards.push({
        icon: '⏱️', title: '집중왕', subtitle: '원판 5개 이하에서 가장 오래 집중!',
        studentName: top.s.studentName,
        detail: `원판 ${top.disks}개에서 ${fmtTime(top.sec)} 동안 집중!`,
        gradient: 'from-blue-400 to-cyan-500',
      });
    }
  }

  // 5. 🎯 정확왕: 최소 이동수 달성자 중 가장 높은 원판 수
  {
    const perfect = students.filter(s =>
      s.allRecords.some(r => r.moves === minMoves(r.disks))
    );
    if (perfect.length > 0) {
      const getMax = (s: StudentSummary) =>
        Math.max(...s.allRecords.filter(r => r.moves === minMoves(r.disks)).map(r => r.disks));
      const sorted = [...perfect].sort((a, b) => getMax(b) - getMax(a));
      const w = sorted.filter(s => s.studentId !== top1Id)[0] ?? sorted[0];
      awards.push({
        icon: '🎯', title: '정확왕', subtitle: '완벽한 최소 이동 달성!',
        studentName: w.studentName, detail: `원판 ${getMax(w)}개를 최소 이동으로 완성!`,
        gradient: 'from-pink-400 to-rose-500',
      });
    }
  }

  return awards;
}

const MEDALS = ['🥇', '🥈', '🥉'];

// ── Page ──────────────────────────────────────────────────
export default function AwardsPage() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState(1);

  const { data: allRecords = [], isLoading } = useQuery<HanoiRecord[]>({
    queryKey: ['/api/records'],
  });

  const classRecords = useMemo(
    () => allRecords.filter(r => getClassNum(r.studentId) === selectedClass),
    [allRecords, selectedClass]
  );

  const summaries = useMemo(() => buildSummaries(classRecords), [classRecords]);

  const top10 = useMemo(
    () => Array.from(summaries.values())
      .sort((a, b) => isBetter(a.bestRecord, b.bestRecord) ? -1 : 1)
      .slice(0, 10),
    [summaries]
  );

  const top1Id = top10[0]?.studentId ?? '';
  const specialAwards = useMemo(() => computeAwards(summaries, top1Id), [summaries, top1Id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isEmpty = classRecords.length === 0;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">🏆 학급 시상식</h1>
            <p className="text-sm text-muted-foreground">하노이타워 · 반별 TOP 10 및 특별상</p>
          </div>
        </div>

        {/* 반 선택 탭 */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }, (_, i) => i + 1).map(cls => (
            <Button
              key={cls}
              size="sm"
              variant={selectedClass === cls ? 'default' : 'outline'}
              onClick={() => setSelectedClass(cls)}
              className={selectedClass === cls
                ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white font-bold'
                : ''}
            >
              {cls}반
            </Button>
          ))}
        </div>

        {isEmpty ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              {selectedClass}반 기록이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* TOP 10 */}
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-400 to-yellow-500 py-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5" />
                  {selectedClass}반 TOP 10
                  <span className="text-xs font-normal opacity-80 ml-1">
                    원판 수 많을수록 ▶ 이동 적을수록 ▶ 시간 빠를수록 상위
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {top10.length === 0 ? (
                  <p className="p-6 text-center text-muted-foreground">순위 데이터가 없습니다.</p>
                ) : (
                  top10.map((student, idx) => {
                    const { bestRecord: r } = student;
                    const rank = idx + 1;
                    const isPodium = rank <= 3;
                    const isPerfect = r.moves === minMoves(r.disks);
                    return (
                      <div
                        key={student.studentId}
                        className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${
                          rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                          rank === 2 ? 'bg-slate-50 dark:bg-slate-800/40' :
                          rank === 3 ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                        }`}
                      >
                        {/* 순위 */}
                        <div className="w-10 shrink-0 text-center">
                          {isPodium
                            ? <span className="text-2xl">{MEDALS[idx]}</span>
                            : <span className="text-lg font-bold text-muted-foreground">{rank}</span>}
                        </div>

                        {/* 학생 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold truncate ${isPodium ? 'text-lg' : ''}`}>
                              {student.studentName}
                            </span>
                            <span className="text-xs text-muted-foreground">{student.studentId}</span>
                            {isPerfect && (
                              <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">완벽!</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                            <span>원판 <b className="text-foreground">{r.disks}개</b></span>
                            <span>이동 <b className={isPerfect ? 'text-emerald-600' : 'text-foreground'}>{r.moves}회</b></span>
                            <span>시간 <b className="text-foreground">{fmtTime(r.seconds)}</b></span>
                            <span className="text-xs">총 {student.attempts}번 도전</span>
                          </div>
                        </div>

                        {/* 원판 배지 */}
                        <Badge variant="outline" className="shrink-0 text-sm font-bold">
                          {r.disks}개
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* 특별상 */}
            {specialAwards.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">🌟 특별상</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specialAwards.map(award => (
                    <div
                      key={award.title}
                      className={`rounded-xl bg-gradient-to-br ${award.gradient} p-[2px] shadow-md`}
                    >
                      <div className="rounded-[10px] bg-white dark:bg-gray-900 p-4 h-full flex flex-col">
                        <div className="text-3xl mb-1">{award.icon}</div>
                        <div className="font-extrabold text-base leading-tight">{award.title}</div>
                        <div className="text-[11px] text-muted-foreground mb-2">{award.subtitle}</div>
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 mt-auto">
                          {award.studentName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{award.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: '참여 학생', value: `${summaries.size}명` },
                { label: '총 도전 횟수', value: `${classRecords.length}회` },
                {
                  label: '최고 원판 수',
                  value: `${Math.max(...Array.from(summaries.values()).map(s => s.bestRecord.disks))}개`,
                },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <CardContent className="py-3">
                    <div className="text-xl font-bold text-amber-600">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
