import { TowerName } from '@/types/game';
import { Disk } from './Disk';

interface TowerProps {
  name: TowerName;
  disks: number[];
  isHighlighted: boolean;
  isInvalid: boolean;
  onDragStart: (disk: number, tower: TowerName, x: number, y: number, element: HTMLElement) => void;
}

export function Tower({ name, disks, isHighlighted, isInvalid, onDragStart }: TowerProps) {
  const towerLabels = {
    A: '기둥 A',
    B: '기둥 B', 
    C: '기둥 C'
  };

  return (
    <div className="text-center">
      <h3 className="text-white font-bold mb-2 text-lg" data-testid={`text-tower-${name}`}>
        {towerLabels[name]}
      </h3>
      <div 
        className={`tower ${isHighlighted ? 'highlight' : ''} ${isInvalid ? 'invalid-drop' : ''}`}
        data-tower={name}
        data-testid={`tower-${name}`}
      >
        {disks.map((diskSize, index) => (
          <Disk
            key={`${name}-${diskSize}-${index}`}
            size={diskSize}
            tower={name}
            isTop={index === disks.length - 1}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}