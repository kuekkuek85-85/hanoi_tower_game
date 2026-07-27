'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, MessageCircle, RefreshCw, Send, Lock } from 'lucide-react';
import { FeedbackText } from '@/components/FeedbackText';
import { useToast } from '@/hooks/use-toast';

interface Reflection {
  id: string;
  participantId: string;
  participantName: string;
  disks: number;
  moves: number;
  content: string;
  aiFeedback: string | null;
  teacherFeedback: string | null;
  status: 'pending' | 'ai_done' | 'teacher_done';
  createdAt: string;
}

const DASHBOARD_PASSWORD = '123456';

export default function TeacherDashboardPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [pwError, setPwError] = useState('');
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reflections = [], isLoading, refetch, isFetching } = useQuery<Reflection[]>({
    queryKey: ['/api/reflections'],
    queryFn: async () => {
      const res = await fetch('/api/reflections');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: authed,
    refetchInterval: false,
  });

  const { mutateAsync: patchFeedback } = useMutation({
    mutationFn: async ({ id, teacherFeedback }: { id: string; teacherFeedback: string }) => {
      const res = await fetch(`/api/reflections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherFeedback }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reflections'] });
    },
  });

  const handleLogin = () => {
    if (password === DASHBOARD_PASSWORD) {
      setAuthed(true);
      setPwError('');
    } else {
      setPwError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleSubmitFeedback = async (id: string) => {
    const fb = feedbacks[id]?.trim();
    if (!fb) {
      toast({ title: '피드백을 입력해주세요.', variant: 'destructive' });
      return;
    }
    setSubmitting(s => ({ ...s, [id]: true }));
    try {
      await patchFeedback({ id, teacherFeedback: fb });
      toast({ title: '피드백이 저장되었습니다.' });
      setFeedbacks(f => { const n = { ...f }; delete n[id]; return n; });
    } catch {
      toast({ title: '저장 실패', variant: 'destructive' });
    } finally {
      setSubmitting(s => ({ ...s, [id]: false }));
    }
  };

  if (!authed) {
    return (
      <Dialog open>
        <DialogContent className="max-w-sm" onInteractOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> 교사 대시보드
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="pw">비밀번호</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="비밀번호 입력"
              />
              {pwError && <p className="text-sm text-red-500">{pwError}</p>}
            </div>
            <Button className="w-full" onClick={handleLogin}>입장</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const sorted = [...reflections].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusLabel = (status: Reflection['status']) => {
    if (status === 'teacher_done') return <Badge className="bg-green-500 text-white text-xs">피드백 완료</Badge>;
    if (status === 'ai_done') return <Badge variant="secondary" className="text-xs">AI 검토 완료</Badge>;
    return <Badge variant="outline" className="text-xs">검토 대기</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">교원 연수 대시보드</h1>
            <p className="text-sm text-muted-foreground mt-1">제출된 알고리즘 풀이와 피드백을 관리합니다</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-20">불러오는 중…</p>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>아직 제출된 풀이가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sorted.map((r) => {
              const minMoves = Math.pow(2, r.disks) - 1;
              const currentFeedback = feedbacks[r.id] ?? r.teacherFeedback ?? '';
              return (
                <Card key={r.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base font-semibold">
                        {r.participantName}
                        <span className="text-muted-foreground text-sm font-normal ml-2">({r.participantId})</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">원판 {r.disks}개</Badge>
                        <Badge variant="outline">{r.moves}회 / 최소 {minMoves}회</Badge>
                        {statusLabel(r.status)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">제출한 풀이</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded p-3">{r.content}</p>
                    </div>

                    {r.aiFeedback && (
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> AI 1차 피드백
                        </p>
                        <FeedbackText text={r.aiFeedback} className="bg-primary/5 border border-primary/20 rounded p-3" />
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> 교사 피드백
                      </p>
                      <Textarea
                        value={currentFeedback}
                        onChange={e => setFeedbacks(f => ({ ...f, [r.id]: e.target.value }))}
                        placeholder="AI 피드백을 검토하고 보완 내용을 작성하세요…"
                        rows={4}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handleSubmitFeedback(r.id)}
                        disabled={submitting[r.id]}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        {submitting[r.id] ? '저장 중…' : '피드백 저장'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
