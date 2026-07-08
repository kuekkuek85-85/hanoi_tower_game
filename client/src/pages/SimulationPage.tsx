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

function getCaption(move: SimMove): { badge: string; badgeStyle: string; text: string } {
  const frames = move.callStack;
  const inner = frames[frames.length - 1];
  const parent = frames.length >= 2 ? frames[frames.length - 2] : null;
  const outer = frames[0];

  // Top-level phase badge
  let badge: string;
  let badgeStyle: string;
  if (frames.length === 1) {
    badge = '핵심 이동!';
    badgeStyle = 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300';
  } else if (outer.phase === 'pre') {
    badge = `① 원판 ${outer.n}번 꺼낼 준비`;
    badgeStyle = 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300';
  } else {
    badge = `③ 원판 ${outer.n}번 이동 완료 → 마무리`;
    badgeStyle = 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300';
  }

  // Short explanation
  let text: string;
  if (!parent) {
    // Disk 5 main move (move 16) — no parent
    text = `위의 원판 ${inner.n - 1}개를 ${inner.aux}로 미리 치웠으니, 이제 원판 ${inner.n}번을 ${inner.dst}로 이동합니다.`;
  } else if (inner.n === 1) {
    // Base case: disk 1 can always move directly
    if (parent.phase === 'pre') {
      text = `원판 1번은 바로 이동 가능합니다. (원판 ${parent.n}번 위를 비우는 중)`;
    } else {
      text = `원판 1번은 바로 이동 가능합니다. (원판 ${parent.n}번 위에 다시 쌓는 중)`;
    }
  } else if (parent.phase === 'pre') {
    // Clearing: moving disk inner.n out of the way to expose parent.n
    text = `원판 ${parent.n}번을 꺼내려면 위의 원판들을 먼저 치워야 합니다. 원판 ${inner.n}번 위의 ${inner.n - 1}개를 치웠으니 이동합니다.`;
  } else {
    // Restoring: moving disk inner.n back onto the destination
    text = `원판 ${parent.n}번을 이미 옮겼습니다. 치워뒀던 원판들을 ${parent.dst}로 이동합니다. 원판 ${inner.n}번을 ${inner.dst}로 이동합니다.`;
  }

  return { badge, badgeStyle, text };
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
                비밀번호를 입력하세요.
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
            <h1 className="text-2xl font-bold">하노이타워 원리 시뮬레이션</h1>
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

        {/* Controls */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={handleReset} title="처음으로">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrev} disabled={step === 0} title="이전">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="lg" className="px-8 min-w-36" onClick={handlePlayPause}>
                {playing
                  ? <><Pause className="h-5 w-5 mr-2" />일시정지</>
                  : <><Play className="h-5 w-5 mr-2" />{step >= total ? '다시보기' : '재생'}</>}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} disabled={step >= total} title="다음">
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
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-semibold">핵심 원리</p>
          <p>원판 5번(가장 큰 판)을 C로 옮기려면?</p>
          <p className="text-muted-foreground">→ 위의 원판 4개를 먼저 B로 치워야 합니다.</p>
          <p className="text-muted-foreground">→ 그 4개를 치우려면? 또 그 위를 먼저 치워야 합니다.</p>
          <p className="text-muted-foreground">→ 이 과정이 계속 반복됩니다.</p>
          <p className="font-medium pt-1">▶ 버튼을 눌러 확인하세요.</p>
        </CardContent>
      </Card>
    );
  }

  if (!move) return null;

  const { badge, badgeStyle, text } = getCaption(move);

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <span>이동 {move.step}/{total}: 원판 {move.disk}번</span>
          <span className="text-muted-foreground font-normal">{move.from} → {move.to}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded border ${badgeStyle}`}>
          {badge}
        </span>
        <p className="text-sm">{text}</p>
      </CardContent>
    </Card>
  );
}
