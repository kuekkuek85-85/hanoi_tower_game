import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { WinModal } from './WinModal';
import { useHanoiGame } from '@/hooks/useHanoiGame';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';

interface GameScreenProps {
  studentId: string;
  studentName: string;
  disks: number;
  onBackToStart: () => void;
}

export function GameScreen({ studentId, studentName, disks, onBackToStart }: GameScreenProps) {
  const {
    gameState,
    initializeGame,
    restartGame,
    moveDisk,
    undoMove,
    canMoveDisk,
    getGameStats,
    calculateMinMoves,
  } = useHanoiGame();
  
  const { toast } = useToast();

  // Initialize game
  useEffect(() => {
    initializeGame(studentId, studentName, disks);
  }, [studentId, studentName, disks, initializeGame]);

  // Toggle body class for scroll lock during game mode
  useEffect(() => {
    // Add game-mode class when GameScreen mounts
    document.body.classList.add('game-mode');
    
    // Remove game-mode class when GameScreen unmounts
    return () => {
      document.body.classList.remove('game-mode');
    };
  }, []);

  const handleBackToStart = () => {
    onBackToStart();
  };

  const handlePlayAgain = () => {
    restartGame();
  };
  
  // 되돌리기 처리 함수 (피드백 포함)
  const handleUndo = useCallback(() => {
    if (gameState.history.length === 0) {
      toast({
        title: '되돌리기 불가능',
        description: '되돌릴 이동이 없습니다.',
        variant: 'destructive',
      });
      return;
    }
    
    const lastMove = gameState.history[gameState.history.length - 1];
    const success = undoMove();
    
    if (success) {
      toast({
        title: '이동 되돌리기 성공',
        description: `원판 ${lastMove.disk}를 ${lastMove.to}에서 ${lastMove.from}으로 되돌렸습니다.`,
      });
    } else {
      toast({
        title: '되돌리기 실패',
        description: '현재 상태에서 되돌리기를 할 수 없습니다.',
        variant: 'destructive',
      });
    }
  }, [undoMove, gameState.history, toast]);

  const minMoves = calculateMinMoves(gameState.disks);
  const gameStats = getGameStats();

  return (
    <div className="game-container" data-testid="game-screen">
      <GameHeader
        gameState={gameState}
        minMoves={minMoves}
        onUndo={handleUndo}
        onRestart={restartGame}
        onBackToStart={handleBackToStart}
      />
      
      <GameBoard
        towers={gameState.towers}
        onMove={moveDisk}
        canMove={(from, to) => canMoveDisk(from, to, gameState.towers)}
        isGameActive={gameState.isGameActive}
      />

      <WinModal
        isOpen={gameState.completed}
        gameStats={gameStats}
        studentId={studentId}
        studentName={studentName}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToStart}
      />
    </div>
  );
}
