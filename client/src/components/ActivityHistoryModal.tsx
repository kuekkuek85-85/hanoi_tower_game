'use client';

import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, MessageCircle, ClipboardList } from 'lucide-react';
import { FeedbackText } from './FeedbackText';

interface Reflection {
  id: string;
  disks: number;
  moves: number;
  content: string;
  aiFeedback: string | null;
  teacherFeedback: string | null;
  status: 'pending' | 'ai_done' | 'teacher_done';
  createdAt: string;
}

interface ActivityHistoryModalProps {
  isOpen: boolean;
  participantId: string;
  onClose: () => void;
}

export function ActivityHistoryModal({ isOpen, participantId, onClose }: ActivityHistoryModalProps) {
  const { data: reflections = [], isLoading } = useQuery<Reflection[]>({
    queryKey: ['/api/reflections/history', participantId],
    queryFn: async () => {
      const res = await fetch(`/api/reflections?participantId=${encodeURIComponent(participantId)}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: isOpen && !!participantId,
    refetchOnWindowFocus: false,
  });

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> 내 활동 기록
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-10">불러오는 중…</p>
        ) : reflections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>아직 제출한 풀이가 없습니다.</p>
            <p className="text-xs mt-1">게임을 완료하고 알고리즘 풀이를 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((r, idx) => {
              const minMoves = Math.pow(2, r.disks) - 1;
              return (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-semibold">
                        #{reflections.length - idx} 제출
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">원판 {r.disks}개</Badge>
                        <Badge variant="outline">{r.moves}회 / 최소 {minMoves}회</Badge>
                        {r.status === 'teacher_done' ? (
                          <Badge className="bg-green-500 text-white text-xs">피드백 완료</Badge>
                        ) : r.status === 'ai_done' ? (
                          <Badge variant="secondary" className="text-xs">AI 검토 완료</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">검토 대기</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString('ko-KR')}
                    </p>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">내가 작성한 풀이</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded p-2">{r.content}</p>
                    </div>

                    {r.teacherFeedback ? (
                      <div>
                        <p className="text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> 교사 피드백
                        </p>
                        <FeedbackText text={r.teacherFeedback} className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 rounded p-2" />
                      </div>
                    ) : r.aiFeedback ? (
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> AI 1차 피드백 (교사 검토 전)
                        </p>
                        <FeedbackText text={r.aiFeedback} className="bg-primary/5 border border-primary/20 rounded p-2" />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
