import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCcw, Undo, Home, Keyboard, HelpCircle } from 'lucide-react';
import { GameState } from '@/types/game';
import { useEffect, useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface GameHeaderProps {
  gameState: GameState;
  minMoves: number;
  onUndo: () => void;
  onRestart: () => void;
  onBackToStart: () => void;
}

export function GameHeader({ 
  gameState, 
  minMoves, 
  onUndo, 
  onRestart, 
  onBackToStart 
}: GameHeaderProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { toggleKeyboardMode, announceMessage } = useAccessibility();
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 확장된 키보드 단축키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 기존 Ctrl+Z 되돌리기
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (gameState.history.length > 0) {
          onUndo();
          announceMessage('이동이 되돌려졌습니다');
        }
        return;
      }

      // 새로운 단축키들
      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onRestart();
            announceMessage('게임이 재시작되었습니다');
          }
          break;
        
        case 'h':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onBackToStart();
            announceMessage('시작 화면으로 이동합니다');
          }
          break;
        
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
            setShowShortcuts(prev => !prev);
            announceMessage(showShortcuts ? '단축키 도움말이 닫혔습니다' : '단축키 도움말이 열렸습니다');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRestart, onBackToStart, toggleKeyboardMode, gameState.history.length, showShortcuts, announceMessage]);

  return (
    <Card className="info-card mx-4 rounded-b-lg shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold" data-testid="text-game-title">
              하노이타워
            </h2>
            <span className="text-muted-foreground" data-testid="text-disk-info">
              ({gameState.disks}개 원판)
            </span>
          </div>
          <div className="text-sm text-muted-foreground" data-testid="text-player-info">
            {gameState.studentId} {gameState.studentName}
          </div>
        </div>

        {/* 게임 상태 정보 */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div className="bg-secondary rounded-lg p-3">
            <div className="text-sm text-muted-foreground">이동 횟수</div>
            <div className="text-xl font-bold" data-testid="text-move-count">
              {gameState.moves}회
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <div className="text-sm text-muted-foreground">최소 이동</div>
            <div className="text-xl font-bold text-primary" data-testid="text-min-moves">
              {minMoves}회
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <div className="text-sm text-muted-foreground">경과 시간</div>
            <div className="text-xl font-bold timer-display" data-testid="text-timer">
              {formatTime(gameState.secondsElapsed)}
            </div>
          </div>
        </div>

        {/* 게임 컨트롤 버튼 */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={onUndo}
                disabled={gameState.history.length === 0}
                data-testid="button-undo"
                aria-label={`이전 이동 되돌리기 (${gameState.history.length}개 이동 가능)`}
                className={gameState.history.length === 0 ? "opacity-50" : ""}
                aria-keyshortcuts="Ctrl+Z"
              >
                <Undo className="h-4 w-4 mr-1" />
                되돌리기
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                {gameState.history.length === 0 
                  ? "되돌릴 이동이 없습니다" 
                  : `이전 이동 되돌리기 (Ctrl+Z)`}
              </p>
              {gameState.history.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  마지막 이동: {gameState.history.length > 0 
                    ? `원판 ${gameState.history[gameState.history.length - 1]?.disk} (${gameState.history[gameState.history.length - 1]?.from} → ${gameState.history[gameState.history.length - 1]?.to})`
                    : "없음"}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRestart}
                data-testid="button-restart"
                aria-label="게임 재시작"
                aria-keyshortcuts="R"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                재시작
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>게임을 처음부터 다시 시작합니다 (R)</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToStart}
                data-testid="button-back-home"
                aria-label="시작 화면으로 돌아가기"
                aria-keyshortcuts="H"
              >
                <Home className="h-4 w-4 mr-1" />
                처음으로
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>시작 화면으로 돌아갑니다 (H)</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showShortcuts ? "default" : "ghost"}
                size="sm"
                onClick={() => setShowShortcuts(prev => !prev)}
                data-testid="button-help"
                aria-label="키보드 단축키 및 접근성 도움말"
                aria-pressed={showShortcuts}
                aria-keyshortcuts="?"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                도움말
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>키보드 단축키 및 접근성 설정 (?)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 접근성 도움말 모달 */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    키보드 단축키 및 접근성 설정
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShortcuts(false)}
                    aria-label="도움말 닫기"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <section>
                    <h3 className="text-lg font-semibold mb-3">전역 키보드 단축키</h3>
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
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>키보드 모드 토글</span>
                        <code className="bg-background px-2 py-1 rounded text-sm">K</code>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>이 도움말 열기/닫기</span>
                        <code className="bg-background px-2 py-1 rounded text-sm">?</code>
                      </div>
                    </div>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-semibold mb-3">키보드 게임 조작법</h3>
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
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
