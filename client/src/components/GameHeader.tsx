import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCcw, Undo, Home } from 'lucide-react';
import { GameState } from '@/types/game';
import { useEffect } from 'react';

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
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 키보드 단축키 지원 (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (gameState.history.length > 0) {
          onUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, gameState.history.length]);

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
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                재시작
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>게임을 처음부터 다시 시작합니다</p>
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
              >
                <Home className="h-4 w-4 mr-1" />
                처음으로
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>시작 화면으로 돌아갑니다</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
