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

function computeAwards(map: Map<string, StudentSummary>): SpecialAward[] {
  const students = Array.from(map.values());
  if (students.length === 0) return [];

  const awards: SpecialAward[] = [];

  // 1. 📈 성장왕: 첫 시도 대비 같은 원판 수 최고 기록 이동수 개선율 최대
  {
    let best = 0;
    let winner: StudentSummary | null = null;
    let detail = '';
    students.forEach(s => {
      if (s.attempts < 2) return;
      const sorted = [...s.allRecords].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const first = sorted[0];
      const sameDisks = s.allRecords.filter(r => r.disks === first.disks && r.id !== first.id);
      if (sameDisks.length === 0) return;
      const bestSame = sameDisks.reduce((a, b) => a.moves < b.moves ? a : b);
      if (first.moves <= minMoves(first.disks)) return;
      const rate = (first.moves - bestSame.moves) / first.moves;
      if (rate > best) {
        best = rate;
        winner = s;
        detail = `처음 ${first.moves}회 → 최고 ${bestSame.moves}회 (${Math.round(rate * 100)}% 개선!)`;
      }
    });
    if (winner) {
      awards.push({ icon: '📈', title: '성장왕', subtitle: '처음보다 가장 크게 성장!',
        studentName: (winner as StudentSummary).studentName, detail, gradient: 'from-emerald-400 to-green-500' });
    }
  }

  // 2. 💪 끈기왕: 시도 횟수 최다
  {
    const w = students.reduce((a, b) => a.attempts > b.attempts ? a : b);
    if (w.attempts >= 2) {
      awards.push({ icon: '💪', title: '끈기왕', subtitle: '포기를 모르는 정신력!',
        studentName: w.studentName, detail: `총 ${w.attempts}번 도전!`, gradient: 'from-orange-400 to-red-500' });
    }
  }

  // 3. ⚡ 속도왕: 최고 원판 수 기준 가장 빠른 완성
  {
    const maxD = Math.max(...students.map(s => s.bestRecord.disks));
    const pool = students.filter(s => s.bestRecord.disks === maxD);
    const getFastest = (s: StudentSummary) =>
      Math.min(...s.allRecords.filter(r => r.disks === maxD).map(r => r.seconds));
    const w = pool.reduce((a, b) => getFastest(a) < getFastest(b) ? a : b);
    awards.push({ icon: '⚡', title: '속도왕', subtitle: `원판 ${maxD}개 최속 완성!`,
      studentName: w.studentName, detail: `${fmtTime(getFastest(w))} 만에 완성!`, gradient: 'from-yellow-400 to-amber-500' });
  }

  // 4. 🏔️ 도전왕: 가장 높은 원판 수 달성
  {
    const w = students.reduce((a, b) => a.bestRecord.disks > b.bestRecord.disks ? a : b);
    awards.push({ icon: '🏔️', title: '도전왕', subtitle: '가장 어려운 단계 도전!',
      studentName: w.studentName, detail: `원판 ${w.bestRecord.disks}개 달성!`, gradient: 'from-purple-400 to-violet-500' });
  }

  // 5. ⏱️ 집중왕: 누적 플레이 시간 최다
  {
    const w = students.reduce((a, b) => a.totalSeconds > b.totalSeconds ? a : b);
    const min = Math.floor(w.totalSeconds / 60);
    awards.push({ icon: '⏱️', title: '집중왕', subtitle: '끝까지 포기 않고 집중!',
      studentName: w.studentName, detail: `누적 ${min}분 이상 플레이!`, gradient: 'from-blue-400 to-cyan-500' });
  }

  // 6. 🎯 정확왕: 최소 이동수 달성 (4개 이상 원판에서 최적해)
  {
    const perfect = students.filter(s =>
      s.allRecords.some(r => r.moves === minMoves(r.disks) && r.disks >= 4)
    );
    if (perfect.length > 0) {
      const getMaxPerfect = (s: StudentSummary) =>
        Math.max(...s.allRecords.filter(r => r.moves === minMoves(r.disks)).map(r => r.disks));
      const w = perfect.reduce((a, b) => getMaxPerfect(a) > getMaxPerfect(b) ? a : b);
      awards.push({ icon: '🎯', title: '정확왕', subtitle: '완벽한 최소 이동 달성!',
        studentName: w.studentName, detail: `원판 ${getMaxPerfect(w)}개를 최소 이동으로!`, gradient: 'from-pink-400 to-rose-500' });
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

  const specialAwards = useMemo(() => computeAwards(summaries), [summaries]);

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
