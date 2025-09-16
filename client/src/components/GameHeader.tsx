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

  // Ctrl+Z 되돌리기 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (gameState.history.length > 0) {
          onUndo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, gameState.history.length]);

  const getLastMove = () => {
    if (gameState.history.length === 0) return null;
    const lastMove = gameState.history[gameState.history.length - 1];
    return `마지막 이동: 원판 ${lastMove.disk} (${lastMove.from} → ${lastMove.to})`;
  };

  return (
    <Card className="mb-6" data-testid="game-header">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* 학생 정보 및 게임 설정 */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-muted-foreground">
                학번: <span className="font-medium" data-testid="text-student-id">{gameState.studentId}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                이름: <span className="font-medium" data-testid="text-student-name">{gameState.studentName}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                원판: <span className="font-medium" data-testid="text-disk-count">{gameState.disks}개</span>
              </span>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUndo}
                    disabled={gameState.history.length === 0}
                    data-testid="button-undo"
                    aria-label="마지막 이동 되돌리기 (Ctrl+Z)"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>되돌리기 (Ctrl+Z)</div>
                    {getLastMove() && <div className="text-muted-foreground mt-1">{getLastMove()}</div>}
                  </div>
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
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>재시작</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBackToStart}
                    data-testid="button-home"
                    aria-label="시작 화면으로"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>처음으로</div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 게임 통계 */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary" data-testid="text-current-moves">
                {gameState.moves}
              </div>
              <div className="text-xs text-muted-foreground">현재 이동</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent" data-testid="text-min-moves">
                {minMoves}
              </div>
              <div className="text-xs text-muted-foreground">최소 이동</div>
            </div>
            <div>
              <div className="text-2xl font-bold" data-testid="text-elapsed-time">
                {formatTime(gameState.secondsElapsed)}
              </div>
              <div className="text-xs text-muted-foreground">경과 시간</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}