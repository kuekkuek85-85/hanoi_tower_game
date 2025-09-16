import { useState, useCallback, useRef } from 'react';
import { DragState, TowerName } from '@/types/game';

export function useDragAndDrop(
  onMove: (from: TowerName, to: TowerName) => boolean,
  canMove: (from: TowerName, to: TowerName) => boolean
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedDisk: null,
    draggedFrom: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const dragElementRef = useRef<HTMLElement | null>(null);

  const startDrag = useCallback((
    disk: number,
    from: TowerName,
    x: number,
    y: number,
    element: HTMLElement
  ) => {
    setDragState({
      isDragging: true,
      draggedDisk: disk,
      draggedFrom: from,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });

    dragElementRef.current = element;
    element.style.position = 'fixed';
    element.style.zIndex = '1000';
    element.style.pointerEvents = 'none';
    element.style.transform = 'scale(1.05) rotate(2deg)';
    element.style.transition = 'none';
  }, []);

  const updateDrag = useCallback((x: number, y: number) => {
    if (!dragState.isDragging || !dragElementRef.current) return;

    setDragState(prev => ({ ...prev, currentX: x, currentY: y }));
    
    const element = dragElementRef.current;
    element.style.left = `${x - element.offsetWidth / 2}px`;
    element.style.top = `${y - element.offsetHeight / 2}px`;
  }, [dragState.isDragging]);

  const endDrag = useCallback((x: number, y: number): boolean => {
    if (!dragState.isDragging || !dragState.draggedFrom || !dragElementRef.current) {
      return false;
    }

    const element = dragElementRef.current;
    
    // 드롭 대상 찾기
    let dropTarget: TowerName | null = null;
    const towers = document.querySelectorAll('[data-tower]');
    
    towers.forEach(tower => {
      const rect = tower.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        dropTarget = tower.getAttribute('data-tower') as TowerName;
      }
    });

    // 원래 위치로 복구
    element.style.position = '';
    element.style.zIndex = '';
    element.style.pointerEvents = '';
    element.style.transform = '';
    element.style.transition = '';
    element.style.left = '';
    element.style.top = '';

    const success = dropTarget && dropTarget !== dragState.draggedFrom 
      ? onMove(dragState.draggedFrom, dropTarget)
      : false;

    setDragState({
      isDragging: false,
      draggedDisk: null,
      draggedFrom: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });

    dragElementRef.current = null;
    return success;
  }, [dragState.isDragging, dragState.draggedFrom, onMove]);

  const getHighlightedTower = useCallback((x: number, y: number): TowerName | null => {
    if (!dragState.isDragging || !dragState.draggedFrom) return null;

    const towers = document.querySelectorAll('[data-tower]');
    
    for (let i = 0; i < towers.length; i++) {
      const tower = towers[i];
      const rect = tower.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const towerName = tower.getAttribute('data-tower') as TowerName;
        if (canMove(dragState.draggedFrom, towerName)) {
          return towerName;
        }
      }
    }

    return null;
  }, [dragState.isDragging, dragState.draggedFrom, canMove]);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    getHighlightedTower,
  };
}
