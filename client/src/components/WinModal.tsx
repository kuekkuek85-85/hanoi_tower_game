import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { GameStats } from '@/types/game';
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type InsertHanoiRecord } from '@shared/schema';

interface WinModalProps {
  isOpen: boolean;
  gameStats: GameStats;
  studentId: string;
  studentName: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function WinModal({ isOpen, gameStats, studentId, studentName, onPlayAgain, onBackToMenu }: WinModalProps) {
  const { toast } = useToast();
  const hasSaved = useRef(false);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const saveGameResult = useMutation({
    mutationFn: async (record: InsertHanoiRecord) => {
      const response = await apiRequest('POST', '/api/records', record);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: '기록 저장 완료',
        description: '게임 결과가 성공적으로 저장되었습니다.',
      });
    },
    onError: () => {
      toast({
        title: '기록 저장 실패',
        description: '게임 결과 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 게임 결과 자동 저장
  useEffect(() => {
    if (isOpen && !hasSaved.current) {
      hasSaved.current = true;
      const record: InsertHanoiRecord = {
        studentId,
        studentName,
        disks: gameStats.disks,
        moves: gameStats.moves,
        seconds: gameStats.timeElapsed,
      };
      saveGameResult.mutate(record);
    }
    
    if (!isOpen) {
      hasSaved.current = false;
    }
  }, [isOpen, studentId, studentName, gameStats, saveGameResult]);
  
  // 축하 효과
  useEffect(() => {
    if (!isOpen) return;

    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(celebration);

    // 색종이 효과
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
          position: absolute;
          left: ${Math.random() * 100}vw;
          background-color: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]};
          width: ${Math.random() * 10 + 5}px;
          height: ${Math.random() * 10 + 5}px;
          animation: confetti-fall 3s linear infinite;
          animation-delay: ${Math.random() * 2}s;
        `;
        celebration.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
      }, i * 50);
    }

    setTimeout(() => {
      celebration.remove();
    }, 3000);

    return () => {
      if (celebration.parentNode) {
        celebration.remove();
      }
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md" data-testid="win-modal">
        <div className="text-center p-6">
          <div className="mb-6">
            <Trophy className="h-16 w-16 text-accent mx-auto mb-4" data-testid="icon-trophy" />
            <h2 className="text-3xl font-bold mb-2" data-testid="text-win-title">
              축하합니다! 🎉
            </h2>
            <p className="text-muted-foreground" data-testid="text-win-subtitle">
              하노이타워를 완성했습니다!
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">총 이동 횟수</div>
                  <div className="text-xl font-bold" data-testid="text-final-moves">
                    {gameStats.moves}회
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">소요 시간</div>
                  <div className="text-xl font-bold" data-testid="text-final-time">
                    {formatTime(gameStats.timeElapsed)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">최소 이동 횟수</div>
                  <div className="text-lg font-semibold text-primary" data-testid="text-final-min-moves">
                    {gameStats.minMoves}회
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">효율성</div>
                  <div 
                    className={`text-lg font-semibold ${gameStats.efficiency >= 100 ? 'text-green-500' : 'text-orange-500'}`}
                    data-testid="text-efficiency"
                  >
                    {gameStats.efficiency}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              onClick={onPlayAgain} 
              className="flex-1"
              data-testid="button-play-again"
            >
              다시 플레이
            </Button>
            <Button 
              variant="secondary" 
              onClick={onBackToMenu} 
              className="flex-1"
              data-testid="button-back-menu"
            >
              처음으로
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
