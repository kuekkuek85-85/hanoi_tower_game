import { useCallback, useRef } from 'react';

export function useGameAudio() {
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  // 오디오 초기화
  const initializeAudio = useCallback(() => {
    // 성공 이동 사운드
    if (!moveAudioRef.current) {
      moveAudioRef.current = new Audio('/sounds/move.mp3');
      moveAudioRef.current.preload = 'auto';
      moveAudioRef.current.volume = 0.5;
    }

    // 에러 사운드
    if (!errorAudioRef.current) {
      errorAudioRef.current = new Audio('/sounds/error.mp3');
      errorAudioRef.current.preload = 'auto';
      errorAudioRef.current.volume = 0.5;
    }
  }, []);

  // 성공 이동 사운드 재생
  const playMoveSound = useCallback(() => {
    try {
      if (!moveAudioRef.current) {
        initializeAudio();
      }
      
      if (moveAudioRef.current) {
        moveAudioRef.current.currentTime = 0;
        moveAudioRef.current.play().catch(() => {
          // 사운드 재생 실패 시 무시 (사용자 상호작용 필요할 수 있음)
        });
      }
    } catch (error) {
      // 오디오 재생 실패 시 무시
    }
  }, [initializeAudio]);

  // 에러 사운드 재생
  const playErrorSound = useCallback(() => {
    try {
      if (!errorAudioRef.current) {
        initializeAudio();
      }
      
      if (errorAudioRef.current) {
        errorAudioRef.current.currentTime = 0;
        errorAudioRef.current.play().catch(() => {
          // 사운드 재생 실패 시 무시
        });
      }
    } catch (error) {
      // 오디오 재생 실패 시 무시
    }
  }, [initializeAudio]);

  return {
    playMoveSound,
    playErrorSound,
    initializeAudio,
  };
}
