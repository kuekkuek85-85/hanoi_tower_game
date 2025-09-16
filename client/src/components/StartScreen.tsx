import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Info, Trophy } from 'lucide-react';

interface StartScreenProps {
  onStartGame: (studentId: string, studentName: string, disks: number) => void;
}

export function StartScreen({ onStartGame }: StartScreenProps) {
  const [, setLocation] = useLocation();
  const [studentInfo, setStudentInfo] = useState('');
  const [diskCount, setDiskCount] = useState([3]);
  const [error, setError] = useState('');

  const validateInput = (input: string): boolean => {
    const regex = /^\d{5}\s[가-힣A-Za-z]+$/;
    return regex.test(input.trim());
  };

  const calculateMinMoves = (n: number): number => {
    return Math.pow(2, n) - 1;
  };

  const handleSubmit = () => {
    const input = studentInfo.trim();
    
    if (!validateInput(input)) {
      setError('올바른 형식으로 입력해주세요 (예: 10101 홍길동)');
      return;
    }

    const parts = input.split(' ');
    const studentId = parts[0];
    const studentName = parts.slice(1).join(' ');

    setError('');
    onStartGame(studentId, studentName, diskCount[0]);
  };

  const handleInputChange = (value: string) => {
    setStudentInfo(value);
    if (error) setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="start-screen">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2" data-testid="title">
              하노이타워
            </h1>
            <p className="text-muted-foreground" data-testid="subtitle">
              교육용 퍼즐 게임
            </p>
          </div>

          {/* 메인 카드 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* 학생 정보 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="student-info">학번과 이름</Label>
                  <Input
                    id="student-info"
                    type="text"
                    placeholder="10101 홍길동"
                    value={studentInfo}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-student-info"
                    className={error ? 'border-red-500' : ''}
                  />
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mr-1" />
                    5자리 학번 + 공백 + 이름 (한글 또는 영문)
                  </div>
                  {error && (
                    <div className="text-sm text-red-500" data-testid="error-message">
                      {error}
                    </div>
                  )}
                </div>

                {/* 원판 개수 선택 */}
                <div className="space-y-3">
                  <Label>원판 개수: {diskCount[0]}개</Label>
                  <Slider
                    value={diskCount}
                    onValueChange={setDiskCount}
                    max={10}
                    min={3}
                    step={1}
                    data-testid="slider-disk-count"
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3개 (쉬움)</span>
                    <span data-testid="text-min-moves">
                      최소 이동: {calculateMinMoves(diskCount[0])}회
                    </span>
                    <span>10개 (어려움)</span>
                  </div>
                </div>

                {/* 시작 버튼 */}
                <Button 
                  onClick={handleSubmit}
                  className="w-full"
                  size="lg"
                  data-testid="button-start-game"
                >
                  게임 시작
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 명예의 전당 버튼 */}
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={() => setLocation('/leaderboard')}
            data-testid="button-leaderboard"
          >
            <Trophy className="h-4 w-4 mr-2" />
            명예의 전당
          </Button>

          {/* 게임 설명 */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">게임 규칙</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 모든 원판을 기둥 C로 이동시키세요</li>
                <li>• 큰 원판을 작은 원판 위에 올릴 수 없습니다</li>
                <li>• 한 번에 하나의 원판만 이동할 수 있습니다</li>
                <li>• 원판을 드래그해서 다른 기둥으로 이동하세요</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}