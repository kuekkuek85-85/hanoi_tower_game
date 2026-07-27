'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Brain, Sparkles, MessageCircle } from 'lucide-react';

interface ReflectionModalProps {
  isOpen: boolean;
  studentId: string;
  studentName: string;
  disks: number;
  moves: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

type Step = 'write' | 'submitting' | 'done';

interface ReflectionResult {
  id: string;
  aiFeedback: string | null;
}

export function ReflectionModal({
  isOpen,
  studentId,
  studentName,
  disks,
  moves,
  onPlayAgain,
  onBackToMenu,
}: ReflectionModalProps) {
  const [content, setContent] = useState('');
  const [step, setStep] = useState<Step>('write');
  const [result, setResult] = useState<ReflectionResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (content.trim().length < 10) {
      setError('10자 이상 작성해주세요.');
      return;
    }
    setError('');
    setStep('submitting');

    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: studentId,
          participantName: studentName,
          disks,
          moves,
          content: content.trim(),
        }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setResult(data);
      setStep('done');
    } catch {
      setError('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStep('write');
    }
  };

  const reset = () => {
    setContent('');
    setStep('write');
    setResult(null);
    setError('');
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            알고리즘 풀이 작성
          </DialogTitle>
          <DialogDescription>
            방금 완성한 하노이 타워를 떠올리며, 원판을 이동시키는 방법을 자연어로 설명해보세요.
          </DialogDescription>
        </DialogHeader>

        {step === 'write' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold">📌 문제</p>
              <p>원판 <b>{disks}개</b>를 기둥 A에서 기둥 C로 모두 옮기려면 어떻게 해야 할까요?</p>
              <p className="text-muted-foreground text-xs mt-1">규칙, 순서, 반복되는 패턴 등을 자유롭게 서술하세요.</p>
            </div>

            <Textarea
              placeholder="예: 가장 작은 원판부터 보조 기둥을 거쳐 옮기는 과정을 반복하면..."
              value={content}
              onChange={e => { setContent(e.target.value); if (error) setError(''); }}
              className="min-h-[160px] resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {error ? <span className="text-red-500">{error}</span> : <span />}
              <span>{content.length}/2000</span>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={content.trim().length < 10}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI 피드백 받기
            </Button>
          </div>
        )}

        {step === 'submitting' && (
          <div className="flex flex-col items-center py-14 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">AI가 풀이를 분석하고 있습니다…</p>
            <p className="text-xs text-muted-foreground">10~20초 정도 소요될 수 있습니다.</p>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">📝 내가 작성한 풀이</p>
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              </CardContent>
            </Card>

            {result.aiFeedback && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI 1차 피드백
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{result.aiFeedback}</p>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <MessageCircle className="h-3 w-3" />
              교사가 피드백을 검토한 후 최종 피드백이 제공됩니다.
            </p>

            <div className="flex gap-3">
              <Button onClick={() => { reset(); onPlayAgain(); }} className="flex-1">
                다시 플레이
              </Button>
              <Button variant="secondary" onClick={() => { reset(); onBackToMenu(); }} className="flex-1">
                처음으로
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
