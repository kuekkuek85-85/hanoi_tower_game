'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Lock } from 'lucide-react';

type Peg = 'A' | 'B' | 'C';
type Phase = 'pre' | 'main' | 'post';

interface CallFrame {
  n: number;
  src: Peg;
  dst: Peg;
  aux: Peg;
  phase: Phase;
}

interface SimMove {
  step: number;
  disk: number;
  from: Peg;
  to: Peg;
  callStack: CallFrame[];
}

type TowerState = Record<Peg, number[]>;

const TOTAL_DISKS = 5;

const DISK_COLORS: Record<number, string> = {
  1: 'bg-blue-400',
  2: 'bg-green-400',
  3: 'bg-yellow-400',
  4: 'bg-orange-400',
  5: 'bg-red-400',
};

const DISK_WIDTH: Record<number, string> = {
  1: '16%',
  2: '32%',
  3: '48%',
  4: '64%',
  5: '80%',
};

const SPEEDS = [0.5, 1, 1.5, 2, 3];

function genMoves(
  n: number,
  src: Peg,
  dst: Peg,
  aux: Peg,
  stack: CallFrame[],
  out: SimMove[],
): void {
  if (n === 0) return;
  genMoves(n - 1, src, aux, dst, [...stack, { n, src, dst, aux, phase: 'pre' }], out);
  out.push({
    step: out.length + 1,
    disk: n,
    from: src,
    to: dst,
    callStack: [...stack, { n, src, dst, aux, phase: 'main' }],
  });
  genMoves(n - 1, aux, dst, src, [...stack, { n, src, dst, aux, phase: 'post' }], out);
}

const ALL_MOVES: SimMove[] = (() => {
  const m: SimMove[] = [];
  genMoves(TOTAL_DISKS, 'A', 'C', 'B', [], m);
  return m;
})();

function calcState(upTo: number): TowerState {
  const s: TowerState = {
    A: Array.from({ length: TOTAL_DISKS }, (_, i) => TOTAL_DISKS - i),
    B: [],
    C: [],
  };
  for (let i = 0; i < upTo; i++) {
    const m = ALL_MOVES[i];
    s[m.to].push(s[m.from].pop()!);
  }
  return s;
}

export default function SimulationPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const stepRef = useRef(0);
  stepRef.current = step;

  const total = ALL_MOVES.length;
  const speed = SPEEDS[speedIdx];
  const towerState = calcState(step);
  const currentMove = step > 0 ? ALL_MOVES[step - 1] : null;

  useEffect(() => {
    if (!playing) return;
    const delay = Math.round(1000 / speed);
    const id = setInterval(() => {
      if (stepRef.current >= total) {
        clearInterval(id);
        setPlaying(false);
        return;
      }
      setStep(prev => prev + 1);
    }, delay);
    return () => clearInterval(id);
  }, [playing, speed, total]);

  const stop = () => setPlaying(false);
  const handlePlayPause = () => {
    if (step >= total) { setStep(0); setPlaying(true); return; }
    setPlaying(p => !p);
  };
  const handlePrev = () => { stop(); setStep(s => Math.max(0, s - 1)); };
  const handleNext = () => { stop(); setStep(s => Math.min(total, s + 1)); };
  const handleReset = () => { stop(); setStep(0); };

  const submitPw = () => {
    if (pw === '123456') { setAuthed(true); setPwErr(''); }
    else { setPwErr('비밀번호가 올바르지 않습니다.'); }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Dialog open>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> 교사 전용 메뉴
              </DialogTitle>
              <DialogDescription>
                재귀 시뮬레이션은 교사 전용입니다. 비밀번호를 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input
                type="password"
                placeholder="비밀번호"
                value={pw}
                onChange={e => { setPw(e.target.value); setPwErr(''); }}
                onKeyDown={e => e.key === 'Enter' && submitPw()}
                autoFocus
              />
              {pwErr && <p className="text-sm text-destructive">{pwErr}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
                  취소
                </Button>
                <Button className="flex-1" onClick={submitPw}>
                  확인
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">하노이타워 재귀 시뮬레이션</h1>
            <p className="text-sm text-muted-foreground">
              교사 전용 · 원판 {TOTAL_DISKS}개 · 총 {total}번 이동
            </p>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-1">
              <span>진행</span>
              <span className="font-semibold">{step} / {total}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(step / total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tower */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              탑 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <TowerViz state={towerState} highlight={currentMove?.disk ?? null} />
          </CardContent>
        </Card>

        {/* Caption */}
        <CaptionCard move={currentMove} step={step} total={total} />

        {/* Call stack */}
        {currentMove && <CallStackCard frames={currentMove.callStack} />}

        {/* Controls */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={handleReset} title="처음으로">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrev} disabled={step === 0} title="이전 단계">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="lg" className="px-8 min-w-36" onClick={handlePlayPause}>
                {playing
                  ? <><Pause className="h-5 w-5 mr-2" />일시정지</>
                  : <><Play className="h-5 w-5 mr-2" />{step >= total ? '다시보기' : '재생'}</>}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} disabled={step >= total} title="다음 단계">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0">속도</span>
              <Slider
                value={[speedIdx]}
                onValueChange={([v]) => setSpeedIdx(v)}
                min={0}
                max={SPEEDS.length - 1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-semibold w-8 text-right">{speed}x</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TowerViz({ state, highlight }: { state: TowerState; highlight: number | null }) {
  const pegs: Peg[] = ['A', 'B', 'C'];
  const labels: Record<Peg, string> = { A: 'A (출발)', B: 'B (보조)', C: 'C (도착)' };

  return (
    <div className="flex gap-2 justify-center py-2">
      {pegs.map(peg => (
        <div key={peg} className="flex-1 flex flex-col items-center">
          <div className="relative flex flex-col items-center w-full">
            {Array.from({ length: TOTAL_DISKS }, (_, i) => {
              // i=0 is top slot; state array is bottom-to-top
              const disk = state[peg][TOTAL_DISKS - 1 - i];
              return (
                <div key={i} className="relative flex items-center justify-center w-full h-7">
                  <div className="absolute w-1 h-full bg-gray-300 dark:bg-gray-600" />
                  {disk !== undefined && (
                    <div
                      className={`relative z-10 h-5 rounded flex items-center justify-center text-white text-xs font-bold transition-all ${DISK_COLORS[disk]} ${disk === highlight ? 'ring-2 ring-white shadow-lg scale-105' : ''}`}
                      style={{ width: DISK_WIDTH[disk] }}
                    >
                      {disk}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="w-full h-2 bg-gray-400 dark:bg-gray-500 rounded" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{labels[peg]}</p>
        </div>
      ))}
    </div>
  );
}

function CaptionCard({ move, step, total }: { move: SimMove | null; step: number; total: number }) {
  if (step === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm space-y-1">
          <p className="font-medium">▶ 버튼을 눌러 시뮬레이션을 시작하세요.</p>
          <p>하노이타워 {TOTAL_DISKS}개를 A→C로 최소 {total}번 이동으로 옮기는 재귀 과정을 단계별로 설명합니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (!move) return null;

  const frame = move.callStack[move.callStack.length - 1];
  const { n, src, dst, aux } = frame;
  const isBase = n === 1;

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          이동 {move.step}/{total}: 원판 {move.disk}번 ({move.from} → {move.to})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBase ? (
          <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm space-y-1">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              기저 조건 — hanoi(1, {src}, {dst}, {aux})
            </p>
            <p className="text-muted-foreground">
              원판 1개는 직접 이동합니다. 재귀가 멈추는 조건(base case)입니다. 더 이상 쪼갤 필요가 없습니다.
            </p>
          </div>
        ) : (
          <div className="rounded-lg p-3 bg-muted/50 border text-sm space-y-2">
            <p className="font-semibold">
              hanoi({n}, {src}, {dst}, {aux}) 실행 중
            </p>
            <p className="text-muted-foreground text-xs">
              "{src} 기둥의 원판 {n}개를 {dst} 기둥으로 옮기기" — 재귀 3단계 분해:
            </p>
            <div className="space-y-1.5">
              <div className="flex gap-2 text-muted-foreground text-xs opacity-70">
                <span className="shrink-0 font-mono font-bold text-blue-500">①</span>
                <span>
                  hanoi({n - 1}, {src}, {aux}, {dst}) 완료 ✓
                  <br />
                  원판 {n - 1}개를 {src}→{aux}로 이동해서 {src}의 맨 아래 원판을 노출시켰습니다.
                </span>
              </div>
              <div className="flex gap-2 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                <span className="shrink-0 font-mono">②</span>
                <span>
                  원판 {n}번을 {src}→{dst}로 이동 ← 바로 이 이동!
                </span>
              </div>
              <div className="flex gap-2 text-muted-foreground text-xs">
                <span className="shrink-0 font-mono font-bold text-purple-500">③</span>
                <span>
                  hanoi({n - 1}, {aux}, {dst}, {src}) 예정
                  <br />
                  {aux}에 옮겨뒀던 원판 {n - 1}개를 {dst}로 이동합니다.
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CallStackCard({ frames }: { frames: CallFrame[] }) {
  const phaseColor: Record<Phase, string> = {
    pre: 'text-blue-600 dark:text-blue-400',
    main: 'text-emerald-600 dark:text-emerald-400',
    post: 'text-purple-600 dark:text-purple-400',
  };
  const phaseTag: Record<Phase, string> = {
    pre: '① 사전 호출 실행 중',
    main: '← 현재 실행!',
    post: '③ 사후 호출 실행 중',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">재귀 호출 스택</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 font-mono text-xs">
          {frames.map((f, i) => {
            const isCurrent = i === frames.length - 1;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                  isCurrent
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700'
                    : f.phase === 'pre'
                      ? 'bg-blue-50 dark:bg-blue-950/20'
                      : 'bg-purple-50 dark:bg-purple-950/20'
                }`}
                style={{ marginLeft: `${i * 12}px` }}
              >
                <span className={isCurrent ? 'font-bold' : ''}>
                  hanoi({f.n}, {f.src}, {f.dst}, {f.aux})
                </span>
                <span className={`ml-auto shrink-0 ${phaseColor[f.phase]}`}>
                  {phaseTag[f.phase]}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          재귀 깊이: {frames.length}단계 (최대 {TOTAL_DISKS}단계)
        </p>
      </CardContent>
    </Card>
  );
}
