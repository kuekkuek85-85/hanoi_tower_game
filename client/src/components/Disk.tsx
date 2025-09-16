import { useRef } from 'react';
import { TowerName } from '@/types/game';

interface DiskProps {
  size: number;
  tower: TowerName;
  isTop: boolean;
  onDragStart: (disk: number, tower: TowerName, x: number, y: number, element: HTMLElement) => void;
}

export function Disk({ size, tower, isTop, onDragStart }: DiskProps) {
  const diskRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isTop || !diskRef.current) return;
    
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    
    onDragStart(size, tower, x, y, diskRef.current);
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
        ${isTop ? 'cursor-grab' : 'cursor-not-allowed'}
      `}
      style={{ width: getDiskWidth(size) }}
      onPointerDown={handlePointerDown}
      data-testid={`disk-${size}-${tower}`}
      data-size={size}
      data-tower={tower}
      title={`원판 ${size} (기둥 ${tower})`}
    />
  );
}