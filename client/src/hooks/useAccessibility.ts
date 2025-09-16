import { useState, useCallback, useEffect } from 'react';
import { AccessibilitySettings, AccessibilityState } from '@/types/game';

const STORAGE_KEY = 'hanoi-accessibility-settings';

const defaultSettings: AccessibilitySettings = {
  keyboardMode: false,
  reducedMotion: false,
  highContrast: false,
  announcements: true,
  soundEffects: true,
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [state, setState] = useState<AccessibilityState>({
    isKeyboardMode: settings.keyboardMode,
    selectedDisk: null,
    selectedTower: null,
    focusedTower: null,
    announcements: [],
    reducedMotion: settings.reducedMotion,
    highContrast: settings.highContrast,
  });

  // 설정 업데이트
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 키보드 모드 토글
  const toggleKeyboardMode = useCallback(() => {
    const newMode = !settings.keyboardMode;
    updateSettings({ keyboardMode: newMode });
    setState(prev => ({ ...prev, isKeyboardMode: newMode }));
    
    announceMessage(newMode ? '키보드 모드가 활성화되었습니다' : '키보드 모드가 비활성화되었습니다');
  }, [settings.keyboardMode, updateSettings]);

  // 메시지 음성 안내
  const announceMessage = useCallback((message: string) => {
    if (!settings.announcements) return;
    
    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message].slice(-10), // 최근 10개만 유지
    }));
  }, [settings.announcements]);

  // 선택된 디스크 설정
  const setSelectedDisk = useCallback((disk: number | null) => {
    setState(prev => ({ ...prev, selectedDisk: disk }));
    
    if (disk !== null) {
      announceMessage(`원판 ${disk}이(가) 선택되었습니다`);
    }
  }, [announceMessage]);

  // 선택된 타워 설정
  const setSelectedTower = useCallback((tower: string | null) => {
    setState(prev => ({ ...prev, selectedTower: tower as any }));
    
    if (tower) {
      announceMessage(`기둥 ${tower}이(가) 선택되었습니다`);
    }
  }, [announceMessage]);

  // 포커스된 타워 설정
  const setFocusedTower = useCallback((tower: string | null) => {
    setState(prev => ({ ...prev, focusedTower: tower as any }));
  }, []);

  // 시스템 설정 감지 및 적용
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, reducedMotion: e.matches || settings.reducedMotion }));
    };

    setState(prev => ({ ...prev, reducedMotion: mediaQuery.matches || settings.reducedMotion }));
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.reducedMotion]);

  // 고대비 모드 적용
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('accessibility-high-contrast');
    } else {
      document.documentElement.classList.remove('accessibility-high-contrast');
    }
  }, [settings.highContrast]);

  // 키보드 모드 클래스 적용
  useEffect(() => {
    if (state.isKeyboardMode) {
      document.documentElement.classList.add('accessibility-keyboard-mode');
    } else {
      document.documentElement.classList.remove('accessibility-keyboard-mode');
    }
  }, [state.isKeyboardMode]);

  return {
    settings,
    state,
    updateSettings,
    toggleKeyboardMode,
    announceMessage,
    setSelectedDisk,
    setSelectedTower,
    setFocusedTower,
  };
}