import { TowerName } from '@/types/game';
import { Disk } from './Disk';
import { useAccessibility } from '@/hooks/useAccessibility';

interface TowerProps {
  name: TowerName;
  disks: number[];
  isHighlighted: boolean;
  isInvalid: boolean;
  onDragStart: (disk: number, tower: TowerName, x: number, y: number, element: HTMLElement) => void;
  isFocused?: boolean;
  selectedDisk?: number | null;
  onKeyboardSelect?: (disk: number, tower: TowerName) => void;
}

export function Tower({ 
  name, 
  disks, 
  isHighlighted, 
  isInvalid, 
  onDragStart,
  isFocused = false,
  selectedDisk = null,
  onKeyboardSelect
}: TowerProps) {
  const { state: accessibilityState } = useAccessibility();
  
  const towerLabels = {
    A: '기둥 A',
    B: '기둥 B', 
    C: '기둥 C'
  };

  const getTowerDescription = () => {
    if (disks.length === 0) {
      return `${towerLabels[name]}은(는) 비어있습니다`;
    }
    const diskDesc = disks.map((disk, index) => 
      index === disks.length - 1 ? `맨 위에 원판 ${disk}` : `원판 ${disk}`
    ).join(', ');
    return `${towerLabels[name]}: ${diskDesc}`;
  };

  return (
    <div className="text-center">
      <h3 
        className={`text-white font-bold mb-2 text-lg ${isFocused ? 'tower-focused' : ''}`}
        data-testid={`text-tower-${name}`}
        id={`tower-${name}-label`}
      >
        {towerLabels[name]}
      </h3>
      
      {/* 숨겨진 기둥 설명 (스크린리더용) */}
      <div 
        id={`tower-${name}-desc`} 
        className="sr-only"
        aria-live="polite"
      >
        {getTowerDescription()}
      </div>
      
      <div 
        className={`
          tower 
          ${isHighlighted ? 'highlight' : ''} 
          ${isInvalid ? 'invalid-drop' : ''} 
          ${isFocused ? 'tower-keyboard-focused' : ''}
        `}
        data-tower={name}
        data-testid={`tower-${name}`}
        role={accessibilityState.isKeyboardMode ? "group" : undefined}
        aria-labelledby={`tower-${name}-label`}
        aria-describedby={`tower-${name}-desc`}
        aria-expanded={accessibilityState.isKeyboardMode ? "true" : undefined}
        tabIndex={accessibilityState.isKeyboardMode && isFocused ? 0 : -1}
      >
        {disks.map((diskSize, index) => (
          <Disk
            key={`${name}-${diskSize}-${index}`}
            size={diskSize}
            tower={name}
            isTop={index === disks.length - 1}
            onDragStart={onDragStart}
            isSelected={selectedDisk === diskSize && index === disks.length - 1}
            isFocused={isFocused && index === disks.length - 1}
            onKeyboardSelect={onKeyboardSelect}
          />
        ))}
        
        {/* 빈 기둥 표시 (접근성) */}
        {disks.length === 0 && (
          <div 
            className="empty-tower-indicator"
            aria-label={`빈 ${towerLabels[name]}`}
            role="status"
          >
            <span className="sr-only">빈 기둥</span>
          </div>
        )}
      </div>
    </div>
  );
}
