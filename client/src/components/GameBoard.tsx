import { useState, useCallback } from 'react';
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
    setHighlightedTower(null);
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [startDrag, handlePointerMove, handlePointerUp]);

  return (
    <div className="game-board" role="application" aria-label="하노이타워 게임">
      <div className="towers-container">
        {(['A', 'B', 'C'] as TowerName[]).map((towerName) => (
          <Tower
            key={towerName}
            name={towerName}
            disks={towers[towerName]}
            isHighlighted={highlightedTower === towerName}
            isInvalid={invalidTower === towerName}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
      
      {/* 드래그 중인 원판 표시 */}
      {dragState.isDragging && (
        <div
          className="dragging-disk"
          style={{
            position: 'fixed',
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
}