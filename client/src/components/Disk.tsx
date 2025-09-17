import { useRef, useState, useEffect } from 'react';
import { TowerName } from '@/types/game';

interface DiskProps {
  size: number;
  tower: TowerName;
  isTop: boolean;
  onDragStart: (disk: number, tower: TowerName, x: number, y: number, element: HTMLElement) => void;
}

export function Disk({ size, tower, isTop, onDragStart }: DiskProps) {
  const diskRef = useRef<HTMLDivElement>(null);
  const [diskWidth, setDiskWidth] = useState<string>('50px');
  
  // 화면 크기 변경 감지하여 원판 크기 업데이트
  useEffect(() => {
    const updateDiskWidth = () => {
      setDiskWidth(getDiskWidth(size));
    };
    
    updateDiskWidth(); // 초기 설정
    
    window.addEventListener('resize', updateDiskWidth);
    window.addEventListener('orientationchange', updateDiskWidth);
    
    return () => {
      window.removeEventListener('resize', updateDiskWidth);
      window.removeEventListener('orientationchange', updateDiskWidth);
    };
  }, [size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTop || !diskRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    
    onDragStart(size, tower, x, y, diskRef.current);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTop || !diskRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
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
    // 화면 크기에 따른 반응형 크기 계산
    const screenWidth = window.innerWidth;
    
    let baseWidth: number;
    let increment: number;
    
    if (screenWidth <= 360) {
      // 작은 스마트폰
      baseWidth = 30;
      increment = 8;
    } else if (screenWidth <= 480) {
      // 스마트폰 세로 모드
      baseWidth = 35;
      increment = 10;
    } else if (screenWidth <= 768 && window.matchMedia('(orientation: landscape)').matches) {
      // 스마트폰 가로 모드
      baseWidth = 40;
      increment = 12;
    } else if (screenWidth <= 768) {
      // 태블릿 세로 모드
      baseWidth = 45;
      increment = 13;
    } else if (screenWidth <= 1024) {
      // 태블릿 가로 모드
      baseWidth = 55;
      increment = 15;
    } else {
      // 데스크톱
      baseWidth = 50;
      increment = 16;
    }
    
    return `${baseWidth + (size - 1) * increment}px`;
  };

  return (
    <div
      ref={diskRef}
      className={`
        disk disk-${size} bg-gradient-to-r ${getDiskColor(size)} 
        ${isTop ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}
        rounded-lg shadow-lg flex items-center justify-center
      `}
      style={{ 
        width: diskWidth,
        minWidth: '30px',
        height: '24px',
        minHeight: '16px',
        zIndex: 10,
        position: 'relative'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      data-testid={`disk-${size}-${tower}`}
      data-size={size}
      data-tower={tower}
      title={`원판 ${size} (기둥 ${tower})`}
    >
      <span 
        className="text-white font-bold text-xs sm:text-sm drop-shadow-lg select-none pointer-events-none"
        style={{
          fontSize: `${Math.max(10, Math.min(16, parseInt(diskWidth) / 8))}px`,
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}
        data-testid={`text-disk-number-${size}-${tower}`}
        aria-label={`원판 ${size}`}
      >
        {size}
      </span>
    </div>
  );
}