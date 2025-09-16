export interface TowerState {
  A: number[];
  B: number[];
  C: number[];
}

export interface GameState {
  studentId: string;
  studentName: string;
  disks: number;
  towers: TowerState;
  moves: number;
  startedAt: number | null;
  secondsElapsed: number;
  history: MoveHistory[];
  completed: boolean;
  isGameActive: boolean;
}

export interface MoveHistory {
  from: keyof TowerState;
  to: keyof TowerState;
  disk: number;
  timestamp: number;
}

export interface DragState {
  isDragging: boolean;
  draggedDisk: number | null;
  draggedFrom: keyof TowerState | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export type TowerName = keyof TowerState;

export interface GameStats {
  moves: number;
  timeElapsed: number;
  minMoves: number;
  efficiency: number;
  disks: number;
}

export interface AccessibilityState {
  isKeyboardMode: boolean;
  selectedDisk: number | null;
  selectedTower: TowerName | null;
  focusedTower: TowerName | null;
  announcements: string[];
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface KeyboardNavigationState {
  currentFocus: 'disk' | 'tower' | null;
  selectedDisk: number | null;
  selectedTower: TowerName | null;
  targetTower: TowerName | null;
  focusedTower: TowerName | null;
  isSelectingTarget: boolean;
}

export interface AccessibilitySettings {
  keyboardMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  announcements: boolean;
  soundEffects: boolean;
}
