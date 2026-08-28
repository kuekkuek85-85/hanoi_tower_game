'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy } from 'lucide-react';
import { HanoiRecord } from '@shared/schema';

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

interface ParticipantSummary {
  studentId: string;
  studentName: string;
  bestRecord: HanoiRecord;
  allRecords: HanoiRecord[];
  attempts: number;
}

function buildSummaries(records: HanoiRecord[]): Map<string, ParticipantSummary> {
  const map = new Map<string, ParticipantSummary>();
  records.forEach(r => {
    const key = `${r.studentId}__${r.studentName}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { studentId: r.studentId, studentName: r.studentName, bestRecord: r, allRecords: [r], attempts: 1 });
    } else {
      cur.allRecords.push(r);
      cur.attempts++;
      if (isBetter(r, cur.bestRecord)) cur.bestRecord = r;
    }
  });
  return map;
}

interface SpecialAward {
  icon: string;
  title: string;
  subtitle: string;
  studentName: string;
  detail: string;
  gradient: string;
}

function pickWinner(sorted: ParticipantSummary[], top1Id: string): ParticipantSummary | null {
  if (sorted.length === 0) return null;
  const non = sorted.filter(s => s.studentId !== top1Id);
  return non.length > 0 ? non[0] : sorted[0];
}

function computeAwards(map: Map<string, ParticipantSummary>, top1Id: string): SpecialAward[] {
  const participants = Array.from(map.values());
  if (participants.length === 0) return [];
  const awards: SpecialAward[] = [];

  // 성장왕
  {
    type Entry = { s: ParticipantSummary; gap: number; worstMoves: number; bestMoves: number; disks: number };
    const entries: Entry[] = [];
    participants.forEach(s => {
      if (s.attempts < 2) return;
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

  // 끈기왕
  {
    const sorted = [...participants].sort((a, b) => b.attempts - a.attempts);
    const w = pickWinner(sorted.filter(s => s.attempts >= 2), top1Id);
    if (w) {
      awards.push({
        icon: '💪', title: '끈기왕', subtitle: '포기를 모르는 정신력!',
        studentName: w.studentName, detail: `총 ${w.attempts}번 도전!`,
        gradient: 'from-orange-400 to-red-500',
      });
    }
  }

  // 속도왕
  {
    type T3 = { s: ParticipantSummary; sec: number };
    const pool: T3[] = [];
    participants.forEach(s => {
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

  // 정확왕
  {
    const perfect = participants.filter(s => s.allRecords.some(r => r.moves === minMoves(r.disks)));
    if (perfect.length > 0) {
      const getMax = (s: ParticipantSummary) =>
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

export default function TrainingAwardsPage() {
  const router = useRouter();

  const { data: allRecords = [], isLoading } = useQuery<HanoiRecord[]>({
    queryKey: ['/api/records?mode=teacher'],
  });

  const summaries = useMemo(() => buildSummaries(allRecords), [allRecords]);

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

  const isEmpty = allRecords.length === 0;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/training')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">🏆 교사 시상식</h1>
            <p className="text-sm text-muted-foreground">하노이타워 · 교사 연수 TOP 10 및 특별상</p>
          </div>
        </div>

        {isEmpty ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              아직 기록이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* TOP 10 */}
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-400 to-yellow-500 py-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5" />
                  연수 참가자 TOP 10
                  <span className="text-xs font-normal opacity-80 ml-1">
                    원판 수 많을수록 ▶ 이동 적을수록 ▶ 시간 빠를수록 상위
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {top10.map((p, idx) => {
                  const { bestRecord: r } = p;
                  const rank = idx + 1;
                  const isPodium = rank <= 3;
                  const isPerfect = r.moves === minMoves(r.disks);
                  return (
                    <div
                      key={`${p.studentId}__${p.studentName}`}
                      className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 ${
                        rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                        rank === 2 ? 'bg-slate-50 dark:bg-slate-800/40' :
                        rank === 3 ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                      }`}
                    >
                      <div className="w-10 shrink-0 text-center">
                        {isPodium
                          ? <span className="text-2xl">{MEDALS[idx]}</span>
                          : <span className="text-lg font-bold text-muted-foreground">{rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold truncate ${isPodium ? 'text-lg' : ''}`}>
                            {p.studentName}
                          </span>
                          <span className="text-xs text-muted-foreground">{p.studentId}</span>
                          {isPerfect && (
                            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">완벽!</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                          <span>원판 <b className="text-foreground">{r.disks}개</b></span>
                          <span>이동 <b className={isPerfect ? 'text-emerald-600' : 'text-foreground'}>{r.moves}회</b></span>
                          <span>시간 <b className="text-foreground">{fmtTime(r.seconds)}</b></span>
                          <span className="text-xs">총 {p.attempts}번 도전</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-sm font-bold">
                        {r.disks}개
                      </Badge>
                    </div>
                  );
                })}
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
                { label: '참여 교사', value: `${summaries.size}명` },
                { label: '총 도전 횟수', value: `${allRecords.length}회` },
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
