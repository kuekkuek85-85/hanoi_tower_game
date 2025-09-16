import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';

interface StartScreenProps {
  onStartGame: (studentId: string, studentName: string, disks: number) => void;
}

export function StartScreen({ onStartGame }: StartScreenProps) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 game-bg">
      <Card className="w-full max-w-md info-card">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold game-title mb-2" data-testid="text-title">
              하노이타워
            </h1>
            <p className="text-muted-foreground" data-testid="text-subtitle">
              수업용 게임
            </p>
          </div>

          <div className="space-y-6">
            {/* 학번과 이름 입력 */}
            <div>
              <Label htmlFor="studentInfo" data-testid="label-student-info">
                학번과 성명
              </Label>
              <Input
                id="studentInfo"
                type="text"
                placeholder="예: 10101 홍길동"
                value={studentInfo}
                onChange={(e) => handleInputChange(e.target.value)}
                className={error ? 'border-destructive' : ''}
                data-testid="input-student-info"
              />
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-input-help">
                5자리 학번 + 공백 + 성명을 입력하세요
              </p>
              {error && (
                <p className="text-xs text-destructive mt-1" data-testid="text-error">
                  {error}
                </p>
              )}
            </div>

            {/* 원판 개수 선택 */}
            <div>
              <Label data-testid="label-disk-count">
                원판 개수: <span className="text-primary font-bold" data-testid="text-disk-count">
                  {diskCount[0]}
                </span>개
              </Label>
              <Slider
                value={diskCount}
                onValueChange={setDiskCount}
                min={3}
                max={10}
                step={1}
                className="mt-2"
                data-testid="slider-disk-count"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span data-testid="text-min-disks">3개</span>
                <span data-testid="text-max-disks">10개</span>
              </div>
            </div>

            {/* 최소 이동 횟수 표시 */}
            <Card className="info-card">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Info className="text-primary mr-2 h-4 w-4" />
                  <span className="text-sm" data-testid="text-min-moves-info">
                    최소 이동 횟수: <span className="font-bold text-primary" data-testid="text-min-moves">
                      {calculateMinMoves(diskCount[0])}
                    </span>회
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 게임 시작 버튼 */}
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
    </div>
  );
}
