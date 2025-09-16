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
    console.log('드래그 시작 - 원판 설정:', disk, from);
    
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
    
    // 원판을 드래그 가능하게 만들기
    const rect = element.getBoundingClientRect();
    element.style.position = 'fixed';
    element.style.left = `${x - rect.width / 2}px`;
    element.style.top = `${y - rect.height / 2}px`;
    element.style.zIndex = '1000';
    element.style.pointerEvents = 'none';
    element.style.transform = 'scale(1.05) rotate(2deg)';
    element.style.transition = 'none';
    element.style.opacity = '0.9';
    
    console.log('원판 스타일 설정 완료');
  }, []);

  const updateDrag = useCallback((x: number, y: number) => {
    if (!dragElementRef.current) {
      console.log('드래그 업데이트 실패: 엘리먼트 없음');
      return;
    }

    console.log('드래그 위치 업데이트:', x, y);
    setDragState(prev => ({ ...prev, currentX: x, currentY: y }));
    
    const element = dragElementRef.current;
    const rect = element.getBoundingClientRect();
    element.style.left = `${x - rect.width / 2}px`;
    element.style.top = `${y - rect.height / 2}px`;
  }, []);

  const endDrag = useCallback((x: number, y: number): boolean => {
    if (!dragState.isDragging || !dragState.draggedFrom || !dragElementRef.current) {
      console.log('드래그 종료 실패:', dragState.isDragging, dragState.draggedFrom, !!dragElementRef.current);
      return false;
    }

    console.log('드래그 종료:', x, y);
    const element = dragElementRef.current;
    
    // 드롭 대상 찾기
    let dropTarget: TowerName | null = null;
    const towers = document.querySelectorAll('[data-tower]');
    
    towers.forEach(tower => {
      const rect = tower.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        dropTarget = tower.getAttribute('data-tower') as TowerName;
        console.log('드롭 대상 찾음:', dropTarget);
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
    element.style.opacity = '';

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
    console.log('드래그 완료, 성공:', success);
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