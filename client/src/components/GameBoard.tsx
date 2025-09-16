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

  const handleDragStart = useCallback((
    disk: number,
    tower: TowerName,
    x: number,
    y: number,
    element: HTMLElement
  ) => {
    console.log('드래그 시작:', disk, tower, x, y);
    startDrag(disk, tower, x, y, element);
    setHighlightedTower(null);
    
    const handleMouseMove = (e: MouseEvent) => {
      console.log('마우스 이동:', e.clientX, e.clientY);
      updateDrag(e.clientX, e.clientY);
      setHighlightedTower(getHighlightedTower(e.clientX, e.clientY));
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault(); // 페이지 스크롤 방지
        const touch = e.touches[0];
        console.log('터치 이동:', touch.clientX, touch.clientY);
        updateDrag(touch.clientX, touch.clientY);
        setHighlightedTower(getHighlightedTower(touch.clientX, touch.clientY));
      }
    };
    
    const handleEnd = (e: MouseEvent | TouchEvent) => {
      let x, y;
      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY;
        console.log('마우스 끝:', x, y);
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        x = touch.clientX;
        y = touch.clientY;
        console.log('터치 끝:', x, y);
      } else {
        return;
      }
      
      endDrag(x, y);
      setHighlightedTower(null);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [startDrag, updateDrag, endDrag, getHighlightedTower]);

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