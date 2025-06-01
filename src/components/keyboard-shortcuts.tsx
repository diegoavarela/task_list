import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: '⌘/Ctrl + N', description: 'Add new task' },
  { key: '⌘/Ctrl + S', description: 'Save changes' },
  { key: '⌘/Ctrl + H', description: 'Toggle completed tasks' },
  { key: '⌘/Ctrl + 1', description: 'Switch to Tasks page' },
  { key: '⌘/Ctrl + 2', description: 'Switch to Companies page' },
  { key: 'Enter', description: 'Add subtask' },
  { key: 'Escape', description: 'Cancel adding subtask' },
];

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-foreground hover:text-background transition-all duration-300 hover:scale-110"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted rounded-md border">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 