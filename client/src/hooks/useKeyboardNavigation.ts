import { useState, useCallback, useEffect } from 'react';
import { KeyboardNavigationState, TowerName, TowerState } from '@/types/game';
import { useAccessibility } from './useAccessibility';

interface UseKeyboardNavigationProps {
  towers: TowerState;
  isGameActive: boolean;
  onMove: (from: TowerName, to: TowerName) => boolean;
  canMove: (from: TowerName, to: TowerName) => boolean;
}

export function useKeyboardNavigation({
  towers,
  isGameActive,
  onMove,
  canMove,
}: UseKeyboardNavigationProps) {
  const { state: accessibilityState, announceMessage, setSelectedDisk, setSelectedTower, setFocusedTower } = useAccessibility();
  
  const [navState, setNavState] = useState<KeyboardNavigationState>({
    currentFocus: null,
    selectedDisk: null,
    selectedTower: null,
    targetTower: null,
    focusedTower: 'A',
    isSelectingTarget: false,
  });

  const towerNames: TowerName[] = ['A', 'B', 'C'];

  // 다음/이전 타워로 포커스 이동
  const moveFocusToTower = useCallback((direction: 'next' | 'prev') => {
    if (!accessibilityState.isKeyboardMode || !isGameActive) return;

    const currentIndex = towerNames.indexOf(navState.focusedTower || 'A');
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % towerNames.length;
    } else {
      newIndex = (currentIndex - 1 + towerNames.length) % towerNames.length;
    }
    
    const newTower = towerNames[newIndex];
    setNavState(prev => ({ ...prev, focusedTower: newTower }));
    setFocusedTower(newTower);
    
    announceMessage(`포커스: 기둥 ${newTower}`);
  }, [accessibilityState.isKeyboardMode, isGameActive, navState.focusedTower, towerNames, setFocusedTower, announceMessage]);

  // 현재 포커스된 타워에서 디스크 선택
  const selectDiskFromTower = useCallback(() => {
    if (!accessibilityState.isKeyboardMode || !isGameActive || !navState.focusedTower) return;

    const tower = navState.focusedTower;
    const disks = towers[tower];
    
    if (disks.length === 0) {
      announceMessage(`기둥 ${tower}에는 원판이 없습니다`);
      return;
    }

    const topDisk = disks[disks.length - 1];
    
    if (navState.selectedDisk === null) {
      // 디스크 선택
      setNavState(prev => ({
        ...prev,
        selectedDisk: topDisk,
        selectedTower: tower,
        isSelectingTarget: true,
      }));
      setSelectedDisk(topDisk);
      setSelectedTower(tower);
      announceMessage(`원판 ${topDisk}이(가) 기둥 ${tower}에서 선택되었습니다. 목표 기둥을 선택하세요`);
    } else {
      // 이미 선택된 디스크가 있는 경우 이동 시도
      if (navState.selectedTower && navState.selectedTower !== tower) {
        attemptMove(navState.selectedTower, tower);
      } else {
        cancelSelection();
      }
    }
  }, [
    accessibilityState.isKeyboardMode,
    isGameActive,
    navState.focusedTower,
    navState.selectedDisk,
    navState.selectedTower,
    towers,
    setSelectedDisk,
    setSelectedTower,
    announceMessage
  ]);

  // 디스크 이동 시도
  const attemptMove = useCallback((from: TowerName, to: TowerName) => {
    if (!canMove(from, to)) {
      announceMessage(`유효하지 않은 이동입니다: 기둥 ${from}에서 기둥 ${to}로`);
      return;
    }

    const success = onMove(from, to);
    
    if (success) {
      const disk = navState.selectedDisk;
      announceMessage(`원판 ${disk}이(가) 기둥 ${from}에서 기둥 ${to}로 이동되었습니다`);
      
      // 이동 후 해당 타워 상태 안내
      setTimeout(() => {
        describeTowerState(to);
      }, 500);
    } else {
      announceMessage(`이동 실패: 기둥 ${from}에서 기둥 ${to}로`);
    }

    // 선택 상태 리셋
    cancelSelection();
  }, [canMove, onMove, navState.selectedDisk, announceMessage]);

  // 선택 취소
  const cancelSelection = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      selectedDisk: null,
      selectedTower: null,
      isSelectingTarget: false,
    }));
    setSelectedDisk(null);
    setSelectedTower(null);
    announceMessage('선택이 취소되었습니다');
  }, [setSelectedDisk, setSelectedTower, announceMessage]);

  // 타워 상태 설명
  const describeTowerState = useCallback((tower: TowerName) => {
    const disks = towers[tower];
    
    if (disks.length === 0) {
      announceMessage(`기둥 ${tower}는 비어있습니다`);
    } else {
      const description = disks.map((disk, index) => 
        index === disks.length - 1 ? `맨 위에 원판 ${disk}` : `원판 ${disk}`
      ).join(', ');
      announceMessage(`기둥 ${tower}: ${description}`);
    }
  }, [towers, announceMessage]);

  // 전체 게임 상태 설명
  const describeGameState = useCallback(() => {
    const descriptions = towerNames.map(tower => {
      const disks = towers[tower];
      if (disks.length === 0) {
        return `기둥 ${tower}: 비어있음`;
      }
      return `기둥 ${tower}: ${disks.length}개 원판 (맨 위: ${disks[disks.length - 1]})`;
    });
    
    announceMessage(`게임 상태: ${descriptions.join(', ')}`);
  }, [towers, towerNames, announceMessage]);

  // 키보드 이벤트 핸들러
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!accessibilityState.isKeyboardMode || !isGameActive) return;

    // 게임 영역에서만 동작하도록 체크
    const gameContainer = document.querySelector('[data-testid="game-board"]');
    if (!gameContainer?.contains(event.target as Node) && 
        !document.querySelector('[data-testid="game-screen"]')?.contains(event.target as Node)) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        moveFocusToTower('prev');
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        moveFocusToTower('next');
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        if (navState.focusedTower) {
          describeTowerState(navState.focusedTower);
        }
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectDiskFromTower();
        break;
      
      case 'Escape':
        event.preventDefault();
        if (navState.selectedDisk !== null) {
          cancelSelection();
        }
        break;
      
      case 's':
      case 'S':
        event.preventDefault();
        describeGameState();
        break;
    }
  }, [
    accessibilityState.isKeyboardMode,
    isGameActive,
    moveFocusToTower,
    navState.focusedTower,
    navState.selectedDisk,
    describeTowerState,
    selectDiskFromTower,
    cancelSelection,
    describeGameState
  ]);

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    if (accessibilityState.isKeyboardMode) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [accessibilityState.isKeyboardMode, handleKeyPress]);

  // 키보드 모드 활성화 시 초기 포커스 및 안내
  useEffect(() => {
    if (accessibilityState.isKeyboardMode && isGameActive) {
      announceMessage('키보드 모드 활성화: 방향키로 기둥 이동, Enter로 원판 선택, S로 게임 상태 확인');
      setNavState(prev => ({ ...prev, focusedTower: 'A' }));
      setFocusedTower('A');
    }
  }, [accessibilityState.isKeyboardMode, isGameActive, announceMessage, setFocusedTower]);

  return {
    navState,
    moveFocusToTower,
    selectDiskFromTower,
    cancelSelection,
    describeTowerState,
    describeGameState,
    handleKeyPress,
  };
}