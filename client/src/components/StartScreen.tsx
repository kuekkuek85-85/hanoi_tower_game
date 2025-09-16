import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Info, Trophy, Keyboard, Settings } from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface StartScreenProps {
  onStartGame: (studentId: string, studentName: string, disks: number) => void;
}

export function StartScreen({ onStartGame }: StartScreenProps) {
  const [, setLocation] = useLocation();
  const [studentInfo, setStudentInfo] = useState('');
  const [diskCount, setDiskCount] = useState([3]);
  const [error, setError] = useState('');
  const [showAccessibilityHelp, setShowAccessibilityHelp] = useState(false);
  
  const { 
    settings, 
    toggleKeyboardMode, 
    updateSettings, 
    announceMessage 
  } = useAccessibility();

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

  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleKeyboardMode();
          }
          break;
        
        case '?':
        case '/':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowAccessibilityHelp(prev => !prev);
            announceMessage(showAccessibilityHelp ? '접근성 도움말이 닫혔습니다' : '접근성 도움말이 열렸습니다');
          }
          break;
        
        case 'enter':
          if (e.target === document.body) {
            e.preventDefault();
            handleSubmit();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleKeyboardMode, showAccessibilityHelp, announceMessage]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 game-bg">
      {/* 건너뛰기 링크 */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-3 py-2 rounded z-50"
        data-testid="skip-link"
      >
        메인 콘텐츠로 건너뛰기
      </a>
      
      <Card className="w-full max-w-md info-card" id="main-content">
        <CardContent className="p-8" role="main" aria-label="하노이 타워 게임 시작">
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

            {/* 접근성 설정 */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-sm">접근성 설정</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="keyboard-mode-start" className="text-sm">키보드 모드</Label>
                  <p className="text-xs text-muted-foreground">키보드로 게임 플레이</p>
                </div>
                <Button
                  id="keyboard-mode-start"
                  onClick={toggleKeyboardMode}
                  variant={settings.keyboardMode ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  aria-pressed={settings.keyboardMode}
                  data-testid="button-keyboard-mode-start"
                >
                  <Keyboard className="h-3 w-3" />
                  {settings.keyboardMode ? '활성' : '비활성'}
                </Button>
              </div>

              <Button
                onClick={() => setShowAccessibilityHelp(true)}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                data-testid="button-accessibility-help"
              >
                <Settings className="mr-1 h-3 w-3" />
                접근성 설정 및 키보드 단축키
              </Button>
            </div>

            {/* 게임 시작 버튼 */}
            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              data-testid="button-start-game"
              aria-describedby={error ? "error-message" : "input-help"}
            >
              게임 시작
            </Button>

            {/* 명예의 전당 버튼 */}
            <Button
              onClick={() => setLocation('/leaderboard')}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-leaderboard"
              aria-label="명예의 전당 보기"
            >
              <Trophy className="mr-2 h-4 w-4" />
              명예의 전당
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 접근성 도움말 모달 */}
      {showAccessibilityHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  접근성 설정 및 키보드 단축키
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccessibilityHelp(false)}
                  aria-label="도움말 닫기"
                  data-testid="button-close-help"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">전역 키보드 단축키</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>키보드 모드 토글</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">K</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>이 도움말 열기/닫기</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">?</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>게임 시작 (포커스 시)</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">Enter</code>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-3">게임 플레이 단축키</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>이전 이동 되돌리기</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">Ctrl+Z</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>게임 재시작</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">R</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>시작 화면으로</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">H</code>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">키보드 게임 모드 조작법</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>기둥 간 이동</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">←→</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>원판 선택/이동</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">Enter/Space</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>기둥 상태 확인</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">↑</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>게임 상태 확인</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">S</code>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>선택 취소</span>
                      <code className="bg-background px-2 py-1 rounded text-sm">Esc</code>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">키보드 게임 플레이 방법:</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>방향키로 원하는 기둥에 포커스를 맞춥니다</li>
                      <li>Enter 또는 Space를 눌러 맨 위 원판을 선택합니다</li>
                      <li>다시 방향키로 목표 기둥을 선택합니다</li>
                      <li>Enter 또는 Space를 눌러 원판을 이동시킵니다</li>
                      <li>Esc를 눌러 언제든 선택을 취소할 수 있습니다</li>
                    </ol>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
