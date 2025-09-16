import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Keyboard, Mouse } from 'lucide-react';
import { Tower } from './Tower';
import { TowerName, TowerState } from '@/types/game';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

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
  
  // 접근성 hooks
  const { 
    state: accessibilityState, 
    toggleKeyboardMode, 
    announceMessage 
  } = useAccessibility();

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

  // 키보드 네비게이션 hook (handleMove 정의 후)
  const keyboardNav = useKeyboardNavigation({
    towers,
    isGameActive,
    onMove: handleMove,
    canMove,
  });

  // 키보드 모드에서 원판 선택 처리
  const handleKeyboardSelect = useCallback((disk: number, tower: TowerName) => {
    if (keyboardNav.selectDiskFromTower) {
      keyboardNav.selectDiskFromTower();
    }
  }, [keyboardNav]);

  return (
    <div className="p-4 pt-8" role="application" aria-label="하노이 타워 게임">
      <div className="max-w-4xl mx-auto">
        {/* 접근성 알림 영역 (스크린리더용) */}
        <div 
          id="game-announcements"
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
          data-testid="announcements"
        >
          {accessibilityState.announcements.slice(-1)[0]}
        </div>
        
        {/* 키보드 모드 토글 */}
        <div className="mb-4 flex justify-between items-center">
          <Button
            onClick={toggleKeyboardMode}
            variant={accessibilityState.isKeyboardMode ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            aria-pressed={accessibilityState.isKeyboardMode}
            aria-describedby="keyboard-mode-desc"
            data-testid="button-toggle-keyboard-mode"
          >
            {accessibilityState.isKeyboardMode ? (
              <>
                <Keyboard className="h-4 w-4" />
                키보드 모드 활성
              </>
            ) : (
              <>
                <Mouse className="h-4 w-4" />
                마우스 모드 활성
              </>
            )}
          </Button>
          
          <div id="keyboard-mode-desc" className="sr-only">
            {accessibilityState.isKeyboardMode 
              ? "키보드로 게임을 플레이할 수 있습니다. 방향키로 기둥 이동, Enter로 원판 선택"
              : "마우스 드래그로 게임을 플레이할 수 있습니다"
            }
          </div>
        </div>

        {/* 키보드 모드 도움말 */}
        {accessibilityState.isKeyboardMode && (
          <Card className="mb-4 info-card">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2" data-testid="text-keyboard-help-title">
                키보드 조작법
              </h4>
              <div className="text-sm text-muted-foreground space-y-1" data-testid="text-keyboard-help">
                <p>• 방향키 ←→: 기둥 간 이동</p>
                <p>• Enter/Space: 원판 선택 및 이동</p>
                <p>• ↑: 현재 기둥 상태 확인</p>
                <p>• S: 전체 게임 상태 확인</p>
                <p>• Esc: 선택 취소</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div 
          className="grid grid-cols-3 gap-4 mb-6" 
          data-testid="game-board"
          role="group"
          aria-label="게임 기둥들"
        >
          <Tower
            name="A"
            disks={towers.A}
            isHighlighted={highlightedTower === 'A'}
            isInvalid={invalidTower === 'A'}
            isFocused={keyboardNav.navState.focusedTower === 'A'}
            selectedDisk={accessibilityState.selectedDisk}
            onDragStart={handleDragStart}
            onKeyboardSelect={handleKeyboardSelect}
          />
          <Tower
            name="B"
            disks={towers.B}
            isHighlighted={highlightedTower === 'B'}
            isInvalid={invalidTower === 'B'}
            isFocused={keyboardNav.navState.focusedTower === 'B'}
            selectedDisk={accessibilityState.selectedDisk}
            onDragStart={handleDragStart}
            onKeyboardSelect={handleKeyboardSelect}
          />
          <Tower
            name="C"
            disks={towers.C}
            isHighlighted={highlightedTower === 'C'}
            isInvalid={invalidTower === 'C'}
            isFocused={keyboardNav.navState.focusedTower === 'C'}
            selectedDisk={accessibilityState.selectedDisk}
            onDragStart={handleDragStart}
            onKeyboardSelect={handleKeyboardSelect}
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
