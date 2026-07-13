import { useState, useCallback } from 'react';
import { Tower } from './Tower';
import { TowerName, TowerState } from '@/types/game';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useGameAudio } from '@/hooks/useGameAudio';

interface GameBoardProps {
  towers: TowerState;
  onMove: (from: TowerName, to: TowerName) => boolean;
  canMove: (from: TowerName, to: TowerName) => boolean;
  isGameActive: boolean;
}

export function GameBoard({ towers, onMove, canMove, isGameActive }: GameBoardProps) {
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
    cancelDrag,
    getHighlightedTower,
  } = useDragAndDrop(handleMove, canMove);

  const handleDragStart = useCallback((
    disk: number,
    tower: TowerName,
    x: number,
    y: number,
    element: HTMLElement
  ) => {
    startDrag(disk, tower, x, y, element);
    setHighlightedTower(null);

    const handleMouseMove = (e: MouseEvent) => {
      updateDrag(e.clientX, e.clientY);
      setHighlightedTower(getHighlightedTower(e.clientX, e.clientY));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        updateDrag(touch.clientX, touch.clientY);
        setHighlightedTower(getHighlightedTower(touch.clientX, touch.clientY));
      }
    };

    // 이벤트 리스너 일괄 정리 함수
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleCancel); // 터치 취소 처리
      document.removeEventListener('visibilitychange', handleVisibility);
      setHighlightedTower(null);
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      let endX: number;
      let endY: number;

      if (e instanceof MouseEvent) {
        endX = e.clientX;
        endY = e.clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
      } else {
        // changedTouches가 비어 있어도 항상 정리 (버그 수정)
        cancelDrag();
        cleanup();
        return;
      }

      endDrag(endX, endY);
      cleanup();
    };

    // 터치 취소(알림창, 멀티터치 등) → 이동 없이 상태만 초기화
    const handleCancel = () => {
      cancelDrag();
      cleanup();
    };

    // 탭이 백그라운드로 전환될 때 드래그 강제 취소
    const handleVisibility = () => {
      if (document.hidden) {
        cancelDrag();
        cleanup();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleCancel);       // 신규
    document.addEventListener('visibilitychange', handleVisibility); // 신규
  }, [startDrag, updateDrag, endDrag, cancelDrag, getHighlightedTower]);

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
