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
interface CallFrame { n: number; src: Peg; dst: Peg; aux: Peg; phase: Phase; }
interface SimMove { step: number; disk: number; from: Peg; to: Peg; callStack: CallFrame[]; }
type TowerState = Record<Peg, number[]>;

const TOTAL_DISKS = 5;
const SPEEDS = [0.5, 1, 1.5, 2, 3];

// ── SVG layout constants ──────────────────────────────────
const VW = 300;
const VH = 220;
const PEG_X: Record<Peg, number> = { A: 55, B: 150, C: 245 };
const BASE_Y = 185;
const DISK_H = 23;   // slot height
const DISK_RH = 18;  // rendered disk height
const GAP = (DISK_H - DISK_RH) / 2;
const D_W: Record<number, number> = { 1: 22, 2: 38, 3: 54, 4: 70, 5: 86 };
const D_FILL: Record<number, string> = {
  1: '#60a5fa', 2: '#4ade80', 3: '#fbbf24', 4: '#fb923c', 5: '#f87171',
};

const dX = (p: Peg, n: number) => PEG_X[p] - D_W[n] / 2;
const dY = (idx: number) => BASE_Y - (idx + 1) * DISK_H + GAP;

// ── Move generator ────────────────────────────────────────
function genMoves(n: number, src: Peg, dst: Peg, aux: Peg, stack: CallFrame[], out: SimMove[]): void {
  if (n === 0) return;
  genMoves(n - 1, src, aux, dst, [...stack, { n, src, dst, aux, phase: 'pre' }], out);
  out.push({ step: out.length + 1, disk: n, from: src, to: dst, callStack: [...stack, { n, src, dst, aux, phase: 'main' }] });
  genMoves(n - 1, aux, dst, src, [...stack, { n, src, dst, aux, phase: 'post' }], out);
}

const ALL_MOVES: SimMove[] = (() => {
  const m: SimMove[] = [];
  genMoves(TOTAL_DISKS, 'A', 'C', 'B', [], m);
  return m;
})();

function calcState(upTo: number): TowerState {
  const s: TowerState = { A: Array.from({ length: TOTAL_DISKS }, (_, i) => TOTAL_DISKS - i), B: [], C: [] };
  for (let i = 0; i < upTo; i++) { const m = ALL_MOVES[i]; s[m.to].push(s[m.from].pop()!); }
  return s;
}

// ── Caption ───────────────────────────────────────────────
function getCaption(move: SimMove) {
  const frames = move.callStack;
  const inner = frames[frames.length - 1];
  const outer = frames[0];
  const isMain = frames.length === 1;
  const isPost = !isMain && outer.phase === 'post';

  if (isMain) {
    return {
      badge: '② 핵심 이동!',
      badgeStyle: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
      text: `위의 원판 ${inner.n - 1}개를 모두 치웠습니다. 드디어 원판 ${inner.n}번을 C로 이동합니다!`,
    };
  }
  if (inner.n === 1) {
    return {
      badge: isPost ? '③ 마무리' : '① 위를 치우는 중',
      badgeStyle: isPost
        ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
        : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
      text: '원판 1번은 바로 이동 가능합니다.',
    };
  }
  if (isPost) {
    return {
      badge: '③ 마무리',
      badgeStyle: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
      text: `원판 ${outer.n}번 이동 완료! 치워뒀던 원판들을 C로 이동 중입니다.`,
    };
  }
  return {
    badge: '① 위를 치우는 중',
    badgeStyle: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
    text: `원판 ${outer.n}번을 꺼내려고 그 위를 비우는 중입니다.`,
  };
}

// ── Page ──────────────────────────────────────────────────
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
  const disk5OnC = towerState.C.includes(5);

  useEffect(() => {
    if (!playing) return;
    const delay = Math.round(1000 / speed);
    const id = setInterval(() => {
      if (stepRef.current >= total) { clearInterval(id); setPlaying(false); return; }
      setStep(prev => prev + 1);
    }, delay);
    return () => clearInterval(id);
  }, [playing, speed, total]);

  const stop = () => setPlaying(false);
  const handlePlayPause = () => {
    if (step >= total) { setStep(0); setPlaying(true); return; }
    setPlaying(p => !p);
  };

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
              <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> 교사 전용 메뉴</DialogTitle>
              <DialogDescription>비밀번호를 입력하세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input type="password" placeholder="비밀번호" value={pw}
                onChange={e => { setPw(e.target.value); setPwErr(''); }}
                onKeyDown={e => e.key === 'Enter' && submitPw()} autoFocus />
              {pwErr && <p className="text-sm text-destructive">{pwErr}</p>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>취소</Button>
                <Button className="flex-1" onClick={submitPw}>확인</Button>
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
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">하노이타워 원리 시뮬레이션</h1>
            <p className="text-sm text-muted-foreground">교사 전용 · 원판 {TOTAL_DISKS}개 · 총 {total}번 이동</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-1">
              <span>진행</span>
              <span className="font-semibold">{step} / {total}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2">
            <TowerSVG state={towerState} move={currentMove} step={step} disk5OnC={disk5OnC} />
          </CardContent>
        </Card>

        <CaptionCard move={currentMove} step={step} total={total} disk5OnC={disk5OnC} />

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={() => { stop(); setStep(0); }}><RotateCcw className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => { stop(); setStep(s => Math.max(0, s - 1)); }} disabled={step === 0}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="lg" className="px-8 min-w-36" onClick={handlePlayPause}>
                {playing ? <><Pause className="h-5 w-5 mr-2" />일시정지</> : <><Play className="h-5 w-5 mr-2" />{step >= total ? '다시보기' : '재생'}</>}
              </Button>
              <Button variant="outline" size="icon" onClick={() => { stop(); setStep(s => Math.min(total, s + 1)); }} disabled={step >= total}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0">속도</span>
              <Slider value={[speedIdx]} onValueChange={([v]) => setSpeedIdx(v)} min={0} max={SPEEDS.length - 1} step={1} className="flex-1" />
              <span className="text-sm font-semibold w-8 text-right">{speed}x</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── SVG Tower ─────────────────────────────────────────────
function TowerSVG({ state, move, step, disk5OnC }: {
  state: TowerState; move: SimMove | null; step: number; disk5OnC: boolean;
}) {
  const pegs: Peg[] = ['A', 'B', 'C'];
  const isInitial = step === 0;
  const isMain = move !== null && move.callStack.length === 1;
  const isPost = move !== null && !isMain && move.callStack[0].phase === 'post';

  const findDisk = (d: number): { peg: Peg; idx: number } | null => {
    for (const p of pegs) { const i = state[p].indexOf(d); if (i !== -1) return { peg: p, idx: i }; }
    return null;
  };

  const disk5Pos = findDisk(5);
  const movingDisk = move?.disk ?? null;

  const arrowColor = isMain ? '#ef4444' : isPost ? '#7c3aed' : '#6366f1';
  const arrowId = isMain ? 'ah-red' : isPost ? 'ah-purple' : 'ah-indigo';

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ maxHeight: '260px' }}>
      <defs>
        <marker id="ah-red" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#ef4444" />
        </marker>
        <marker id="ah-indigo" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#6366f1" />
        </marker>
        <marker id="ah-purple" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#7c3aed" />
        </marker>
        <marker id="ah-blue" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#3b82f6" />
        </marker>
        {/* Diagonal hatch for frozen disk 5 */}
        <pattern id="hatch-gray" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#6b7280" strokeWidth="1.5" />
        </pattern>
      </defs>

      {/* Peg poles */}
      {pegs.map(p => (
        <rect key={p} x={PEG_X[p] - 2} y={36} width={4} height={BASE_Y - 36} fill="#c1c8d4" rx={2} />
      ))}
      {/* Peg bases */}
      {pegs.map(p => (
        <rect key={`b-${p}`} x={PEG_X[p] - 40} y={BASE_Y} width={80} height={5} fill="#9ca3af" rx={2} />
      ))}

      {/* INITIAL: blue dashed box around disks 1–4 */}
      {isInitial && (() => {
        const topY = dY(TOTAL_DISKS - 1) - 4;
        const botY = dY(1) + DISK_RH + 4;
        return (
          <rect x={PEG_X.A - D_W[TOTAL_DISKS - 1] / 2 - 4} y={topY}
            width={D_W[TOTAL_DISKS - 1] + 8} height={botY - topY}
            fill="#dbeafe" fillOpacity={0.45} stroke="#3b82f6" strokeWidth={2}
            strokeDasharray="5,3" rx={5} />
        );
      })()}

      {/* Red dashed box: disk 5 target (before it reaches C) */}
      {!disk5OnC && disk5Pos && !isMain && (() => {
        const { peg, idx } = disk5Pos;
        return (
          <rect x={dX(peg, 5) - 3} y={dY(idx) - 3}
            width={D_W[5] + 6} height={DISK_RH + 6}
            fill="#fee2e2" fillOpacity={0.5}
            stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5,3" rx={5} />
        );
      })()}

      {/* Locked green box: disk 5 done on C */}
      {disk5OnC && (() => {
        const idx = state.C.indexOf(5);
        return (
          <>
            <rect x={dX('C', 5) - 3} y={dY(idx) - 3}
              width={D_W[5] + 6} height={DISK_RH + 6}
              fill="#d1fae5" fillOpacity={0.55}
              stroke="#10b981" strokeWidth={2.5} rx={5} />
            {/* "완료" badge above disk 5 */}
            <rect x={PEG_X.C - 14} y={dY(idx) - 18} width={28} height={12} fill="#10b981" rx={3} />
            <text x={PEG_X.C} y={dY(idx) - 10} textAnchor="middle"
              fill="white" fontSize={8} fontWeight="bold">완료 ✓</text>
          </>
        );
      })()}


      {/* Disks */}
      {pegs.map(p =>
        state[p].map((d, idx) => {
          const isFrozen = d === 5 && disk5OnC;
          const justMoved = movingDisk === d && move?.to === p && idx === state[p].length - 1;
          const x = dX(p, d);
          const y = dY(idx);
          const w = D_W[d];
          const fill = isFrozen ? '#9ca3af' : D_FILL[d];
          return (
            <g key={`${p}-${d}`}>
              <rect x={x} y={y} width={w} height={DISK_RH} fill={fill} rx={3} />
              {/* Diagonal hatch for frozen disk 5 */}
              {isFrozen && (
                <rect x={x} y={y} width={w} height={DISK_RH}
                  fill="url(#hatch-gray)" rx={3} opacity={0.35} />
              )}
              {justMoved && !isFrozen && (
                <rect x={x - 3} y={y - 3} width={w + 6} height={DISK_RH + 6}
                  fill="none" stroke="white" strokeWidth={2.5} rx={5} />
              )}
              <text x={PEG_X[p]} y={y + DISK_RH / 2} textAnchor="middle"
                dominantBaseline="middle"
                fill={isFrozen ? '#374151' : 'white'} fontSize={10} fontWeight="bold">
                {d}
              </text>
            </g>
          );
        })
      )}

      {/* Move arrow */}
      {move && move.from !== move.to && (() => {
        const fx = PEG_X[move.from];
        const tx = PEG_X[move.to];
        const mx = (fx + tx) / 2;
        return (
          <path d={`M ${fx} 28 Q ${mx} 8 ${tx} 28`}
            fill="none" stroke={arrowColor} strokeWidth={isMain ? 3 : 2}
            strokeLinecap="round" markerEnd={`url(#${arrowId})`} />
        );
      })()}

      {/* INITIAL: two concept arrows */}
      {isInitial && (
        <>
          <path d={`M ${PEG_X.A} 22 Q ${(PEG_X.A + PEG_X.B) / 2} 6 ${PEG_X.B} 22`}
            fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5,3"
            strokeLinecap="round" markerEnd="url(#ah-blue)" />
          <path d={`M ${PEG_X.A} 29 Q ${(PEG_X.A + PEG_X.C) / 2} 10 ${PEG_X.C} 29`}
            fill="none" stroke="#ef4444" strokeWidth={2.5}
            strokeLinecap="round" markerEnd="url(#ah-red)" />
          <text x={PEG_X.B} y={16} textAnchor="middle" fill="#3b82f6" fontSize={9} fontWeight="bold">먼저</text>
          <text x={PEG_X.C} y={16} textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight="bold">목표</text>
        </>
      )}

      {/* MAIN event label */}
      {isMain && (
        <text x={(PEG_X[move!.from] + PEG_X[move!.to]) / 2} y={18}
          textAnchor="middle" fill="#ef4444" fontSize={10} fontWeight="bold">
          드디어 이동!
        </text>
      )}

      {/* Peg labels */}
      {([['A', '출발'], ['B', '보조'], ['C', '도착']] as [Peg, string][]).map(([p, lbl]) => (
        <text key={`lbl-${p}`} x={PEG_X[p as Peg]} y={VH - 4}
          textAnchor="middle" fill="#6b7280" fontSize={10}>
          {p} ({lbl})
        </text>
      ))}
    </svg>
  );
}

// ── Caption card ──────────────────────────────────────────
function CaptionCard({ move, step, total, disk5OnC }: {
  move: SimMove | null; step: number; total: number; disk5OnC: boolean;
}) {
  if (step === 0) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 shrink-0 rounded border-2 border-dashed border-red-400 bg-red-50" />
            <span><b>빨간 점선:</b> 꺼내야 할 원판 (최종 목표)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 shrink-0 rounded border-2 border-dashed border-blue-400 bg-blue-50" />
            <span><b>파란 점선:</b> 먼저 다른 기둥으로 치워야 할 원판들</span>
          </div>
          <p className="text-muted-foreground pt-1 text-xs">▶ 재생 버튼을 눌러 단계별로 확인하세요.</p>
        </CardContent>
      </Card>
    );
  }

  if (!move) return null;
  const { badge, badgeStyle, text } = getCaption(move);

  // Step 16: disk 5 just moved to C — problem reduced
  const justReduced = move.disk === 5 && move.callStack.length === 1;

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <span>이동 {move.step}/{total}: 원판 {move.disk}번</span>
          <span className="text-muted-foreground font-normal text-sm">{move.from} → {move.to}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded border ${badgeStyle}`}>
          {badge}
        </span>
        <p className="text-sm">{text}</p>

        {/* Problem-reduction banner */}
        {justReduced && (
          <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-300 dark:bg-amber-900/30 dark:border-amber-600">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
              🎯 문제가 줄었습니다!
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              5개 이동 문제 → <b>4개 이동 문제</b>로 축소됐습니다.
              이제 원판 1~4번만 C로 옮기면 끝!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
