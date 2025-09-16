import { useRef } from 'react';
import { TowerName } from '@/types/game';
import { useAccessibility } from '@/hooks/useAccessibility';

interface DiskProps {
  size: number;
  tower: TowerName;
  isTop: boolean;
  onDragStart: (disk: number, tower: TowerName, x: number, y: number, element: HTMLElement) => void;
  isSelected?: boolean;
  isFocused?: boolean;
  onKeyboardSelect?: (disk: number, tower: TowerName) => void;
}

export function Disk({ 
  size, 
  tower, 
  isTop, 
  onDragStart, 
  isSelected = false, 
  isFocused = false, 
  onKeyboardSelect 
}: DiskProps) {
  const diskRef = useRef<HTMLDivElement>(null);
  const { state: accessibilityState } = useAccessibility();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isTop || !diskRef.current) return;
    if (accessibilityState.isKeyboardMode) return; // 키보드 모드에서는 드래그 비활성화
    
    e.preventDefault();
    const rect = diskRef.current.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    onDragStart(size, tower, x, y, diskRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isTop || !onKeyboardSelect) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onKeyboardSelect(size, tower);
    }
  };

  const handleClick = () => {
    if (accessibilityState.isKeyboardMode && isTop && onKeyboardSelect) {
      onKeyboardSelect(size, tower);
    }
  };

  const getDiskColor = (size: number): string => {
    const colors = [
      'from-red-400 to-red-600',
      'from-orange-400 to-orange-600', 
      'from-yellow-400 to-yellow-600',
      'from-green-400 to-green-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-cyan-400 to-cyan-600',
      'from-lime-400 to-lime-600',
      'from-amber-400 to-amber-600',
    ];
    return colors[(size - 1) % colors.length];
  };

  const getDiskWidth = (size: number): string => {
    const baseWidth = 60;
    const increment = 20;
    return `${baseWidth + (size - 1) * increment}px`;
  };

  return (
    <div
      ref={diskRef}
      className={`
        disk disk-${size} bg-gradient-to-r ${getDiskColor(size)} 
        ${isTop && !accessibilityState.isKeyboardMode ? 'cursor-grab' : 'cursor-not-allowed'}
        ${isSelected ? 'disk-selected' : ''}
        ${isFocused ? 'disk-focused' : ''}
        ${isTop && accessibilityState.isKeyboardMode ? 'keyboard-interactive' : ''}
      `}
      style={{ width: getDiskWidth(size) }}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      data-testid={`disk-${size}-${tower}`}
      data-size={size}
      data-tower={tower}
      // 접근성 속성
      role={isTop && accessibilityState.isKeyboardMode ? "button" : undefined}
      tabIndex={isTop && accessibilityState.isKeyboardMode ? 0 : -1}
      aria-label={`크기 ${size} 원판${isTop ? ', 선택 가능' : ', 이동 불가'}`}
      aria-describedby={`tower-${tower}-desc`}
      aria-selected={isSelected}
      aria-disabled={!isTop}
      aria-keyshortcuts={isTop && accessibilityState.isKeyboardMode ? "Enter Space" : undefined}
      title={`원판 ${size} (기둥 ${tower})`}
    />
  );
}
