import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HelpCircle, Keyboard, Settings, Eye, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useEffect } from 'react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AccessibilityModal({ isOpen, onOpenChange, trigger }: AccessibilityModalProps) {
  const { settings, state, updateSettings, announceMessage } = useAccessibility();

  // 모달이 열릴 때 포커스 트랩을 위한 키보드 이벤트
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        announceMessage('접근성 설정이 닫혔습니다');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange, announceMessage]);

  const shortcuts = [
    { key: 'Ctrl + Z', description: '이전 이동 되돌리기' },
    { key: 'R', description: '게임 재시작' },
    { key: 'H', description: '시작 화면으로 이동' },
    { key: 'K', description: '키보드 모드 토글' },
    { key: '? 또는 /', description: '이 도움말 열기/닫기' },
    { key: 'Tab', description: '다음 요소로 이동' },
    { key: 'Shift + Tab', description: '이전 요소로 이동' },
    { key: 'Enter 또는 Space', description: '버튼 활성화/원판 선택' },
  ];

  const keyboardInstructions = [
    { key: '방향키 ←→', description: '기둥 간 이동' },
    { key: 'Enter/Space', description: '원판 선택 및 이동' },
    { key: '↑', description: '현재 기둥 상태 확인' },
    { key: 'S', description: '전체 게임 상태 확인' },
    { key: 'Esc', description: '선택 취소' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        aria-describedby="accessibility-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            접근성 설정 및 키보드 단축키
          </DialogTitle>
        </DialogHeader>

        <div id="accessibility-modal-description" className="space-y-6">
          {/* 접근성 설정 */}
          <section aria-labelledby="settings-title">
            <h3 id="settings-title" className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4" />
              접근성 설정
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="keyboard-mode">키보드 모드</Label>
                  <p className="text-sm text-muted-foreground">
                    마우스 드래그 대신 키보드로 게임 플레이
                  </p>
                </div>
                <Switch
                  id="keyboard-mode"
                  checked={settings.keyboardMode}
                  onCheckedChange={(checked) => {
                    updateSettings({ keyboardMode: checked });
                    announceMessage(checked ? '키보드 모드가 활성화되었습니다' : '키보드 모드가 비활성화되었습니다');
                  }}
                  aria-describedby="keyboard-mode-desc"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="reduced-motion">애니메이션 감소</Label>
                  <p className="text-sm text-muted-foreground">
                    움직임과 애니메이션 효과 최소화
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => {
                    updateSettings({ reducedMotion: checked });
                    announceMessage(checked ? '애니메이션이 감소되었습니다' : '애니메이션이 활성화되었습니다');
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="high-contrast">고대비 모드</Label>
                  <p className="text-sm text-muted-foreground">
                    시각적 대비 향상으로 가독성 개선
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => {
                    updateSettings({ highContrast: checked });
                    announceMessage(checked ? '고대비 모드가 활성화되었습니다' : '고대비 모드가 비활성화되었습니다');
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="announcements">음성 안내</Label>
                  <p className="text-sm text-muted-foreground">
                    스크린리더를 위한 게임 상태 안내
                  </p>
                </div>
                <Switch
                  id="announcements"
                  checked={settings.announcements}
                  onCheckedChange={(checked) => {
                    updateSettings({ announcements: checked });
                    if (checked) {
                      announceMessage('음성 안내가 활성화되었습니다');
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="sound-effects">효과음</Label>
                  <p className="text-sm text-muted-foreground">
                    게임 동작 시 소리 재생
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => {
                    updateSettings({ soundEffects: checked });
                    announceMessage(checked ? '효과음이 활성화되었습니다' : '효과음이 비활성화되었습니다');
                  }}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* 일반 키보드 단축키 */}
          <section aria-labelledby="shortcuts-title">
            <h3 id="shortcuts-title" className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Keyboard className="h-4 w-4" />
              키보드 단축키
            </h3>
            
            <div className="grid gap-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">{shortcut.description}</span>
                  <Badge variant="secondary" className="font-mono">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* 키보드 모드 전용 단축키 */}
          <section aria-labelledby="keyboard-game-title">
            <h3 id="keyboard-game-title" className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Keyboard className="h-4 w-4" />
              키보드 게임 모드 조작법
            </h3>
            
            <div className="grid gap-3">
              {keyboardInstructions.map((instruction, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">{instruction.description}</span>
                  <Badge variant="outline" className="font-mono">
                    {instruction.key}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">키보드 게임 플레이 방법:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>방향키로 원하는 기둥에 포커스를 맞춥니다</li>
                <li>Enter 또는 Space를 눌러 맨 위 원판을 선택합니다</li>
                <li>다시 방향키로 목표 기둥을 선택합니다</li>
                <li>Enter 또는 Space를 눌러 원판을 이동시킵니다</li>
                <li>Esc를 눌러 언제든 선택을 취소할 수 있습니다</li>
              </ol>
            </div>
          </section>

          {/* 닫기 버튼 */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => onOpenChange(false)}
              data-testid="button-close-accessibility"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}