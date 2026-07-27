'use client';

import { useState } from 'react';
import { StartScreen } from '@/components/StartScreen';
import { GameScreen } from '@/components/GameScreen';
import { WelcomeModal } from '@/components/WelcomeModal';

interface HomePageProps {
  mode?: 'student' | 'teacher';
}

export default function HomePage({ mode = 'student' }: HomePageProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameConfig, setGameConfig] = useState<{
    studentId: string;
    studentName: string;
    disks: number;
  } | null>(null);

  const handleStartGame = (studentId: string, studentName: string, disks: number) => {
    setGameConfig({ studentId, studentName, disks });
    setGameStarted(true);
  };

  const handleBackToStart = () => {
    setGameStarted(false);
    setGameConfig(null);
  };

  if (gameStarted && gameConfig) {
    return (
      <GameScreen
        studentId={gameConfig.studentId}
        studentName={gameConfig.studentName}
        disks={gameConfig.disks}
        onBackToStart={handleBackToStart}
      />
    );
  }

  return (
    <>
      {mode === 'student' && <WelcomeModal />}
      <StartScreen onStartGame={handleStartGame} mode={mode} />
    </>
  );
}
