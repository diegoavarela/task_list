import { useEffect } from 'react';

interface Shortcut {
  key: string;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      shortcuts.forEach(({ key, callback }) => {
        const [modifierKey, actionKey] = key.split(' + ');
        
        if (modifierKey === '⌘/Ctrl') {
          if (modifier && event.key.toLowerCase() === actionKey.toLowerCase()) {
            event.preventDefault();
            callback();
          }
        } else if (event.key === key) {
          event.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
} 