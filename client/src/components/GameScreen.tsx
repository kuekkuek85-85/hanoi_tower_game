import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { WinModal } from './WinModal';
import { useHanoiGame } from '@/hooks/useHanoiGame';
import { useEffect } from 'react';

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

  useEffect(() => {
    initializeGame(studentId, studentName, disks);
  }, [studentId, studentName, disks, initializeGame]);

  const handleBackToStart = () => {
    onBackToStart();
  };

  const handlePlayAgain = () => {
    restartGame();
  };

  const minMoves = calculateMinMoves(gameState.disks);
  const gameStats = getGameStats();

  return (
    <div className="game-container" data-testid="game-screen">
      <GameHeader
        gameState={gameState}
        minMoves={minMoves}
        onUndo={undoMove}
        onRestart={restartGame}
        onBackToStart={handleBackToStart}
      />
      
      <GameBoard
        towers={gameState.towers}
        onMove={moveDisk}
        canMove={(from, to) => canMoveDisk(from, to, gameState.towers)}
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
