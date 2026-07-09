'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'hanoi_welcome_hide_until';

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  const v = localStorage.getItem(STORAGE_KEY);
  if (!v) return true;
  return Date.now() > Number(v);
}

function setHidden(days: number) {
  localStorage.setItem(STORAGE_KEY, String(Date.now() + days * 86_400_000));
}

type HideChoice = 'day' | 'week' | null;

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [hideChoice, setHideChoice] = useState<HideChoice>(null);

  useEffect(() => {
    setOpen(shouldShow());
  }, []);

  const close = () => {
    if (hideChoice === 'week') setHidden(7);
    else if (hideChoice === 'day') setHidden(1);
    setOpen(false);
  };

  const toggleChoice = (choice: 'day' | 'week') => {
    setHideChoice(prev => (prev === choice ? null : choice));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55">
      <div className="relative w-full max-w-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* X 버튼 */}
        <button
          onClick={close}
          aria-label="닫기"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 pr-12">
          <h2 className="text-xl font-bold text-white">하노이타워 게임 안내</h2>
          <p className="text-indigo-100 text-sm mt-0.5">수업 시작 전 교사 설명용 자료</p>
        </div>

        {/* 슬라이드 영역 */}
        <div className="px-6 pt-5 pb-2 min-h-[300px]">
          {slide === 0 ? <Slide1 /> : <Slide2 />}
        </div>

        {/* 하단 영역 */}
        <div className="px-6 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">

          {/* 슬라이드 점 */}
          <div className="flex justify-center gap-2">
            {[0, 1].map(i => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`슬라이드 ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  slide === i
                    ? 'bg-indigo-500 scale-110'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* 보지 않음 체크박스 */}
          <div className="flex flex-col gap-2 text-sm">
            {([
              ['day', '하루 동안 보지 않음'],
              ['week', '일주일 동안 보지 않음'],
            ] as ['day' | 'week', string][]).map(([choice, label]) => (
              <label key={choice} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hideChoice === choice}
                  onChange={() => toggleChoice(choice)}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
                <span className="text-gray-600 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>

          {/* 이전 / 다음·닫기 버튼 */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSlide(0)}
              disabled={slide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>

            {slide === 0 ? (
              <Button size="sm" onClick={() => setSlide(1)}>
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={close} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                게임 시작하기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 슬라이드 1: 게임 목표 ─────────────────────────────────
function Slide1() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
        🗼 하노이타워란?
      </h3>

      {/* 타워 SVG 일러스트 */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 140" className="w-full max-w-sm">
          <defs>
            <marker id="wm-arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" fill="#ef4444" />
            </marker>
          </defs>

          {/* 기둥 A */}
          <rect x="48" y="30" width="4" height="85" fill="#c1c8d4" rx="2" />
          <rect x="10" y="113" width="80" height="6" fill="#9ca3af" rx="2" />
          {/* 원판들 (아래부터: 4,3,2,1) */}
          <rect x="15" y="99"  width="70" height="14" fill="#f87171" rx="3" />
          <rect x="22" y="84"  width="56" height="14" fill="#fb923c" rx="3" />
          <rect x="29" y="69"  width="42" height="14" fill="#fbbf24" rx="3" />
          <rect x="36" y="54"  width="28" height="14" fill="#4ade80" rx="3" />
          {/* 원판 번호 */}
          <text x="50" y="110" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">4</text>
          <text x="50" y="95"  textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">3</text>
          <text x="50" y="80"  textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">2</text>
          <text x="50" y="65"  textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">1</text>

          {/* 기둥 B */}
          <rect x="148" y="30" width="4" height="85" fill="#c1c8d4" rx="2" />
          <rect x="110" y="113" width="80" height="6" fill="#9ca3af" rx="2" />

          {/* 기둥 C */}
          <rect x="248" y="30" width="4" height="85" fill="#c1c8d4" rx="2" />
          <rect x="210" y="113" width="80" height="6" fill="#9ca3af" rx="2" />
          {/* 목표 표시 */}
          <rect x="213" y="99" width="74" height="14" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,2" rx="3" />
          <rect x="213" y="84" width="74" height="14" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,2" rx="3" />
          <rect x="213" y="69" width="74" height="14" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,2" rx="3" />
          <rect x="213" y="54" width="74" height="14" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4,2" rx="3" />

          {/* A → C 화살표 */}
          <path d="M 50 25 Q 150 4 250 25" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#wm-arrow)" />
          <text x="150" y="14" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">목표!</text>

          {/* 기둥 레이블 */}
          <text x="50"  y="128" textAnchor="middle" fill="#6b7280" fontSize="10">A (출발)</text>
          <text x="150" y="128" textAnchor="middle" fill="#6b7280" fontSize="10">B (보조)</text>
          <text x="250" y="128" textAnchor="middle" fill="#6b7280" fontSize="10">C (도착)</text>
        </svg>
      </div>

      <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
        <li>📌 기둥 <b>A, B, C</b> 세 개가 있습니다.</li>
        <li>📌 <b>A 기둥</b>에 크기가 다른 원판들이 쌓여 있습니다.</li>
        <li className="text-indigo-600 dark:text-indigo-400 font-semibold">
          🎯 목표: A의 원판을 <b>모두 C로</b> 옮기세요!
        </li>
      </ul>
    </div>
  );
}

// ── 슬라이드 2: 게임 규칙 ─────────────────────────────────
function Slide2() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
        📋 게임 규칙
      </h3>

      <div className="space-y-3">
        <RuleItem
          num={1}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          text="한 번에 원판 1개만 옮길 수 있습니다."
        />
        <RuleItem
          num={2}
          color="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          text="작은 원판은 큰 원판 위에 올릴 수 있습니다."
        />
        <RuleItem
          num={3}
          color="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          text="큰 원판은 작은 원판 위에 올릴 수 없습니다."
        />
        <RuleItem
          num={4}
          color="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
          text="세 기둥을 모두 활용하여 최소 이동 횟수로 완성하면 기록에 남습니다!"
        />
      </div>

      {/* 가능 vs 불가 미니 SVG */}
      <div className="flex gap-4 justify-center pt-1">
        {/* 가능 */}
        <div className="flex flex-col items-center gap-1">
          <svg viewBox="0 0 70 62" className="w-20">
            {/* 바닥 */}
            <rect x="5"  y="56" width="60" height="6" fill="#9ca3af" rx="2" />
            {/* 기둥 */}
            <rect x="31" y="4"  width="4" height="52" fill="#c1c8d4" rx="2" />
            {/* 큰 원판 (아래) */}
            <rect x="14" y="42" width="42" height="13" fill="#fb923c" rx="3" />
            {/* 작은 원판 (위) */}
            <rect x="23" y="28" width="24" height="13" fill="#fbbf24" rx="3" />
          </svg>
          <span className="text-xs font-semibold text-green-600">✅ 가능</span>
          <span className="text-[10px] text-gray-500 text-center">작은 판 →<br/>큰 판 위에</span>
        </div>

        <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch" />

        {/* 불가 */}
        <div className="flex flex-col items-center gap-1">
          <svg viewBox="0 0 70 62" className="w-20">
            {/* 바닥 */}
            <rect x="5"  y="56" width="60" height="6" fill="#9ca3af" rx="2" />
            {/* 기둥 */}
            <rect x="31" y="4"  width="4" height="52" fill="#c1c8d4" rx="2" />
            {/* 작은 원판 (아래) */}
            <rect x="23" y="42" width="24" height="13" fill="#fbbf24" rx="3" />
            {/* 큰 원판 (위에 올리려는 중 — 반투명) */}
            <rect x="14" y="28" width="42" height="13" fill="#f87171" rx="3" opacity="0.6" />
            {/* X 표시 */}
            <line x1="18" y1="30" x2="52" y2="40" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="52" y1="30" x2="18" y2="40" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-red-600">❌ 불가</span>
          <span className="text-[10px] text-gray-500 text-center">큰 판 →<br/>작은 판 위에</span>
        </div>
      </div>
    </div>
  );
}

function RuleItem({ num, color, text }: { num: number; color: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${color}`}>
        {num}
      </span>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
    </div>
  );
}
