import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, TowerState, MoveHistory, TowerName, GameStats } from '@/types/game';

const INITIAL_TOWER_STATE: TowerState = { A: [], B: [], C: [] };

export function useHanoiGame() {
  const [gameState, setGameState] = useState<GameState>({
    studentId: '',
    studentName: '',
    disks: 3,
    towers: INITIAL_TOWER_STATE,
    moves: 0,
    startedAt: null,
    secondsElapsed: 0,
    history: [],
    completed: false,
    isGameActive: false,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 최소 이동 횟수 계산
  const calculateMinMoves = useCallback((n: number): number => {
    return Math.pow(2, n) - 1;
  }, []);

  // 타이머 시작
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (!prev.startedAt || prev.completed) return prev;
        
        const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
        return { ...prev, secondsElapsed: elapsed };
      });
    }, 1000);
  }, []);

  // 타이머 정지
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 게임 초기화
  const initializeGame = useCallback((studentId: string, studentName: string, disks: number) => {
    const towers: TowerState = { A: [], B: [], C: [] };
    
    // 모든 원판을 A 기둥에 배치 (큰 것부터 작은 것 순으로)
    for (let i = disks; i >= 1; i--) {
      towers.A.push(i);
    }

    setGameState({
      studentId,
      studentName,
      disks,
      towers,
      moves: 0,
      startedAt: Date.now(),
      secondsElapsed: 0,
      history: [],
      completed: false,
      isGameActive: true,
    });

    startTimer();
  }, [startTimer]);

  // 재시작
  const restartGame = useCallback(() => {
    if (!gameState.studentId) return;
    
    initializeGame(gameState.studentId, gameState.studentName, gameState.disks);
  }, [gameState.studentId, gameState.studentName, gameState.disks, initializeGame]);

  // 이동 가능 여부 확인
  const canMoveDisk = useCallback((from: TowerName, to: TowerName, towers: TowerState): boolean => {
    const fromStack = towers[from];
    const toStack = towers[to];

    if (fromStack.length === 0) return false;
    if (toStack.length === 0) return true;

    const diskToMove = fromStack[fromStack.length - 1];
    const topDiskOnDestination = toStack[toStack.length - 1];

    return diskToMove < topDiskOnDestination;
  }, []);

  // 원판 이동
  const moveDisk = useCallback((from: TowerName, to: TowerName): boolean => {
    if (!gameState.isGameActive || gameState.completed) return false;
    if (!canMoveDisk(from, to, gameState.towers)) return false;

    setGameState(prev => {
      // 완전한 불변성 보장을 위해 타워 배열을 깊게 복제
      const newTowers: TowerState = {
        A: [...prev.towers.A],
        B: [...prev.towers.B],
        C: [...prev.towers.C]
      };
      const disk = newTowers[from].pop()!;
      newTowers[to].push(disk);

      const newHistory: MoveHistory = {
        from,
        to,
        disk,
        timestamp: Date.now(),
      };

      const newState = {
        ...prev,
        towers: newTowers,
        moves: prev.moves + 1,
        history: [...prev.history, newHistory],
      };

      // 승리 조건 확인
      if (newTowers.C.length === prev.disks) {
        newState.completed = true;
        newState.isGameActive = false;
      }

      return newState;
    });

    return true;
  }, [gameState.isGameActive, gameState.completed, gameState.towers, canMoveDisk]);

  // 되돌리기
  const undoMove = useCallback((): boolean => {
    if (gameState.history.length === 0) return false;

    setGameState(prev => {
      const lastMove = prev.history[prev.history.length - 1];
      // 완전한 불변성 보장을 위해 타워 배열을 깊게 복제
      const newTowers: TowerState = {
        A: [...prev.towers.A],
        B: [...prev.towers.B],
        C: [...prev.towers.C]
      };
      
      const disk = newTowers[lastMove.to].pop()!;
      newTowers[lastMove.from].push(disk);

      const wasCompleted = prev.completed;
      const newState = {
        ...prev,
        towers: newTowers,
        moves: Math.max(0, prev.moves - 1),
        history: prev.history.slice(0, -1),
        completed: false,
        isGameActive: true,
      };

      // 게임이 완료된 상태에서 되돌리기를 하면 타이머 재시작
      if (wasCompleted) {
        setTimeout(() => startTimer(), 0);
      }

      return newState;
    });
    
    return true;
  }, [gameState.history.length, startTimer]);

  // 게임 통계 계산
  const getGameStats = useCallback((): GameStats => {
    const minMoves = calculateMinMoves(gameState.disks);
    const efficiency = gameState.moves > 0 ? Math.round((minMoves / gameState.moves) * 100) : 100;

    return {
      moves: gameState.moves,
      timeElapsed: gameState.secondsElapsed,
      minMoves,
      efficiency,
      disks: gameState.disks,
    };
  }, [gameState.moves, gameState.secondsElapsed, gameState.disks, calculateMinMoves]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // 게임 완료 시 타이머 정지
  useEffect(() => {
    if (gameState.completed) {
      stopTimer();
    }
  }, [gameState.completed, stopTimer]);

  return {
    gameState,
    initializeGame,
    restartGame,
    moveDisk,
    undoMove,
    canMoveDisk,
    getGameStats,
    calculateMinMoves,
  };
}
