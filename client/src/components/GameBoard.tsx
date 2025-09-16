import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Tower } from './Tower';
import { TowerName, TowerState } from '@/types/game';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useGameAudio } from '@/hooks/useGameAudio';

interface GameBoardProps {
  towers: TowerState;
  onMove: (from: TowerName, to: TowerName) => boolean;
  canMove: (from: TowerName, to: TowerName) => boolean;
}

export function GameBoard({ towers, onMove, canMove }: GameBoardProps) {
  const [highlightedTower, setHighlightedTower] = useState<TowerName | null>(null);
  const [invalidTower, setInvalidTower] = useState<TowerName | null>(null);
  const { playMoveSound, playErrorSound } = useGameAudio();

  const handleMove = useCallback((from: TowerName, to: TowerName): boolean => {
    const success = onMove(from, to);
    
    if (success) {
      playMoveSound();
    } else {
      playErrorSound();
      setInvalidTower(to);
      setTimeout(() => setInvalidTower(null), 500);
    }
    
    return success;
  }, [onMove, playMoveSound, playErrorSound]);

  const {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    getHighlightedTower,
  } = useDragAndDrop(handleMove, canMove);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState.isDragging) return;
    
    const x = e.clientX;
    const y = e.clientY;
    updateDrag(x, y);
    setHighlightedTower(getHighlightedTower(x, y));
  }, [dragState.isDragging, updateDrag, getHighlightedTower]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!dragState.isDragging) return;
    
    const x = e.clientX;
    const y = e.clientY;
    endDrag(x, y);
    setHighlightedTower(null);
    
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }, [dragState.isDragging, endDrag, handlePointerMove]);

  const handleDragStart = useCallback((
    disk: number,
    tower: TowerName,
    x: number,
    y: number,
    element: HTMLElement
  ) => {
    startDrag(disk, tower, x, y, element);
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [startDrag, handlePointerMove, handlePointerUp]);

  return (
    <div className="p-4 pt-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6" data-testid="game-board">
          <Tower
            name="A"
            disks={towers.A}
            isHighlighted={highlightedTower === 'A'}
            isInvalid={invalidTower === 'A'}
            onDragStart={handleDragStart}
          />
          <Tower
            name="B"
            disks={towers.B}
            isHighlighted={highlightedTower === 'B'}
            isInvalid={invalidTower === 'B'}
            onDragStart={handleDragStart}
          />
          <Tower
            name="C"
            disks={towers.C}
            isHighlighted={highlightedTower === 'C'}
            isInvalid={invalidTower === 'C'}
            onDragStart={handleDragStart}
          />
        </div>

        {/* 규칙 안내 */}
        <Card className="info-card">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground" data-testid="text-game-rules">
              <AlertTriangle className="inline h-4 w-4 text-accent mr-1" />
              작은 원판 위에 큰 원판을 놓을 수 없습니다. 모든 원판을 기둥 C로 옮겨주세요!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
