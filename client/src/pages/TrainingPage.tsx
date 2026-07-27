'use client';

import { useState, useEffect } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { ActivityHistoryModal } from '@/components/ActivityHistoryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, GraduationCap, History, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Participant {
  school: string;
  name: string;
}

const STORAGE_SCHOOL = 'hanoiTrainingSchool';
const STORAGE_NAME = 'hanoiTrainingName';

export default function TrainingPage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [school, setSchool] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [diskCount, setDiskCount] = useState([3]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_SCHOOL);
    const n = localStorage.getItem(STORAGE_NAME);
    if (s && n) setParticipant({ school: s, name: n });
  }, []);

  const handleLogin = () => {
    const s = school.trim();
    const n = name.trim();
    if (!s || !n) {
      setError('소속학교와 성함을 모두 입력해주세요.');
      return;
    }
    localStorage.setItem(STORAGE_SCHOOL, s);
    localStorage.setItem(STORAGE_NAME, n);
    setParticipant({ school: s, name: n });
    setError('');
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_SCHOOL);
    localStorage.removeItem(STORAGE_NAME);
    setParticipant(null);
    setSchool('');
    setName('');
  };

  const calculateMinMoves = (n: number) => Math.pow(2, n) - 1;

  if (isPlaying && participant) {
    return (
      <GameScreen
        studentId={participant.school}
        studentName={participant.name}
        disks={diskCount[0]}
        onBackToStart={() => setIsPlaying(false)}
        mode="teacher"
      />
    );
  }

  return (
    <div className="start-screen">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* 헤더 */}
          <div className="text-center mb-8 relative">
            {participant && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 text-xs"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-3.5 w-3.5 mr-1" />
                내 활동 기록
              </Button>
            )}
            <h1 className="text-4xl font-bold mb-2">하노이타워</h1>
            <p className="text-muted-foreground">교원 연수용</p>
          </div>

          {/* 메인 카드 */}
          <Card className="mb-6">
            <CardContent className="p-6 space-y-6">
              {!participant ? (
                /* 로그인 */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="school">소속학교</Label>
                    <Input
                      id="school"
                      placeholder="OO초등학교"
                      value={school}
                      onChange={e => { setSchool(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tname">성함</Label>
                    <Input
                      id="tname"
                      placeholder="홍길동"
                      value={name}
                      onChange={e => { setName(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button className="w-full" onClick={handleLogin}>확인</Button>
                </div>
              ) : (
                /* 로그인 완료 → 원판 선택 */
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{participant.name}</span>
                      <span className="text-muted-foreground text-xs">({participant.school})</span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      변경
                    </button>
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

                  <Button className="w-full" size="lg" onClick={() => setIsPlaying(true)}>
                    게임 시작
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full mb-3"
            onClick={() => router.push('/training/leaderboard')}
          >
            <Trophy className="h-4 w-4 mr-2" />
            명예의 전당
          </Button>

          <Button
            variant="ghost"
            className="w-full mb-4 text-sm text-muted-foreground"
            onClick={() => router.push('/training/dashboard')}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            교사 대시보드
          </Button>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">게임 규칙</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 모든 원판을 기둥 C로 이동시키세요</li>
                <li>• 큰 원판을 작은 원판 위에 올릴 수 없습니다</li>
                <li>• 한 번에 하나의 원판만 이동할 수 있습니다</li>
                <li>• 게임 완료 후 알고리즘 풀이를 작성합니다</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {participant && (
        <ActivityHistoryModal
          isOpen={showHistory}
          participantId={participant.school}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
