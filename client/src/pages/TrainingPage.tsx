'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Info, Trophy, Award, Users } from 'lucide-react';
import { GameScreen } from '@/components/GameScreen';

const LS_SCHOOL = 'hanoiTrainingSchool';
const LS_NAME = 'hanoiTrainingName';
const LS_PARTICIPANT_ID = 'hanoiTrainingParticipantId';

export default function TrainingPage() {
  const router = useRouter();
  const [school, setSchool] = useState('');
  const [name, setName] = useState('');
  const [diskCount, setDiskCount] = useState([3]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [gameConfig, setGameConfig] = useState<{
    school: string;
    name: string;
    disks: number;
    participantId: string;
  } | null>(null);

  useEffect(() => {
    const savedSchool = localStorage.getItem(LS_SCHOOL);
    const savedName = localStorage.getItem(LS_NAME);
    if (savedSchool) setSchool(savedSchool);
    if (savedName) setName(savedName);

    fetch('/api/training')
      .then(r => r.json())
      .then(d => setParticipantCount(d.count ?? null))
      .catch(() => {});
  }, []);

  const calculateMinMoves = (n: number) => Math.pow(2, n) - 1;

  const handleStart = async () => {
    if (!school.trim() || !name.trim()) {
      setError('학교명과 이름을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school: school.trim(), name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '참가 등록에 실패했습니다.');
        return;
      }

      localStorage.setItem(LS_SCHOOL, school.trim());
      localStorage.setItem(LS_NAME, name.trim());
      localStorage.setItem(LS_PARTICIPANT_ID, data.id);

      setGameConfig({ school: school.trim(), name: name.trim(), disks: diskCount[0], participantId: data.id });
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStart = async () => {
    const participantId = localStorage.getItem(LS_PARTICIPANT_ID);
    if (participantId) {
      await fetch('/api/training', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: participantId }),
      }).catch(() => {});
      localStorage.removeItem(LS_PARTICIPANT_ID);
    }
    setGameConfig(null);
  };

  if (gameConfig) {
    return (
      <GameScreen
        studentId={gameConfig.school}
        studentName={gameConfig.name}
        disks={gameConfig.disks}
        mode="teacher"
        onBackToStart={handleBackToStart}
      />
    );
  }

  return (
    <div className="start-screen">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">하노이타워</h1>
            <p className="text-muted-foreground">교사 연수 체험</p>
          </div>

          {participantCount !== null && (
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>현재 참가자: <strong>{participantCount}</strong> / 15명</span>
            </div>
          )}

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="school">학교명</Label>
                  <Input
                    id="school"
                    type="text"
                    placeholder="예: 한국중학교"
                    value={school}
                    onChange={(e) => { setSchool(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tname">이름</Label>
                  <Input
                    id="tname"
                    type="text"
                    placeholder="예: 홍길동"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  />
                </div>

                <div className="space-y-3">
                  <Label>원판 개수: {diskCount[0]}개</Label>
                  <Slider
                    value={diskCount}
                    onValueChange={setDiskCount}
                    max={10}
                    min={3}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3개 (쉬움)</span>
                    <span>최소 이동: {calculateMinMoves(diskCount[0])}회</span>
                    <span>10개 (어려움)</span>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-500 flex items-start gap-1">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleStart}
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? '등록 중...' : '게임 시작'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full mb-3"
            onClick={() => router.push('/training/leaderboard')}
          >
            <Trophy className="h-4 w-4 mr-2" />
            교사 명예의 전당
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground text-sm"
            onClick={() => router.push('/training/awards')}
          >
            <Award className="h-4 w-4 mr-2" />
            교사 시상식
          </Button>
        </div>
      </div>
    </div>
  );
}
