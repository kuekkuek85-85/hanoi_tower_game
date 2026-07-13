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
  const dragInfoRef = useRef<{
    isDragging: boolean;
    draggedFrom: TowerName | null;
    draggedDisk: number | null;
  }>({
    isDragging: false,
    draggedFrom: null,
    draggedDisk: null,
  });

  // 드래그 중 엘리먼트 스타일 및 상태를 항상 초기화하는 공통 정리 함수
  const resetDragState = useCallback(() => {
    if (dragElementRef.current) {
      const el = dragElementRef.current;
      el.style.position = '';
      el.style.zIndex = '';
      el.style.pointerEvents = '';
      el.style.transform = '';
      el.style.transition = '';
      el.style.left = '';
      el.style.top = '';
      el.style.opacity = '';
      dragElementRef.current = null;
    }
    dragInfoRef.current = { isDragging: false, draggedFrom: null, draggedDisk: null };
    setDragState({
      isDragging: false,
      draggedDisk: null,
      draggedFrom: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, []);

  const startDrag = useCallback((
    disk: number,
    from: TowerName,
    x: number,
    y: number,
    element: HTMLElement
  ) => {
    dragInfoRef.current = { isDragging: true, draggedFrom: from, draggedDisk: disk };

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

    const rect = element.getBoundingClientRect();
    element.style.position = 'fixed';
    element.style.left = `${x - rect.width / 2}px`;
    element.style.top = `${y - rect.height / 2}px`;
    element.style.zIndex = '1000';
    element.style.pointerEvents = 'none';
    element.style.transform = 'scale(1.05) rotate(2deg)';
    element.style.transition = 'none';
    element.style.opacity = '0.9';
  }, []);

  const updateDrag = useCallback((x: number, y: number) => {
    if (!dragInfoRef.current.isDragging || !dragElementRef.current) return;

    setDragState(prev => ({ ...prev, currentX: x, currentY: y }));

    const element = dragElementRef.current;
    const rect = element.getBoundingClientRect();
    element.style.left = `${x - rect.width / 2}px`;
    element.style.top = `${y - rect.height / 2}px`;
  }, []);

  const endDrag = useCallback((x: number, y: number): boolean => {
    // 드래그 정보를 먼저 저장 후 즉시 상태 초기화 (항상 실행)
    const { isDragging, draggedFrom } = dragInfoRef.current;
    resetDragState();

    if (!isDragging || !draggedFrom) return false;

    const towers = document.querySelectorAll('.tower[data-tower]');
    let dropTarget: TowerName | null = null;
    let bestDistance = Infinity;

    towers.forEach(tower => {
      const rect = tower.getBoundingClientRect();
      const towerName = tower.getAttribute('data-tower') as TowerName;

      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (distance < bestDistance) {
          bestDistance = distance;
          dropTarget = towerName;
        }
      }
    });

    if (dropTarget && dropTarget !== draggedFrom) {
      return onMove(draggedFrom, dropTarget);
    }
    return false;
  }, [onMove, resetDragState]);

  // 터치 취소 등 비정상 종료 시 사용 (이동 시도 없이 상태만 초기화)
  const cancelDrag = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const getHighlightedTower = useCallback((x: number, y: number): TowerName | null => {
    if (!dragInfoRef.current.isDragging || !dragInfoRef.current.draggedFrom) return null;

    const towers = document.querySelectorAll('.tower[data-tower]');
    let closestTower: TowerName | null = null;
    let bestDistance = Infinity;

    for (let i = 0; i < towers.length; i++) {
      const tower = towers[i];
      const rect = tower.getBoundingClientRect();

      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        const towerName = tower.getAttribute('data-tower') as TowerName;
        if (canMove(dragInfoRef.current.draggedFrom!, towerName) && distance < bestDistance) {
          bestDistance = distance;
          closestTower = towerName;
        }
      }
    }

    return closestTower;
  }, [canMove]);

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    getHighlightedTower,
  };
}
