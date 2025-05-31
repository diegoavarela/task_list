import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface LayoutProps {
  currentPage: 'tasks' | 'companies';
  onPageChange: (page: 'tasks' | 'companies') => void;
  children: React.ReactNode;
  onSave?: () => void;
  saveError?: string | null;
}

export function Layout({ currentPage, onPageChange, children, onSave, saveError }: LayoutProps) {
  const { toast } = useToast();

  const handleSave = () => {
    if (onSave) {
      onSave();
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <h1 className="text-2xl font-bold text-primary">The Freelo List</h1>
          </div>
          <nav className="ml-auto flex gap-4">
            <Button
              variant={currentPage === 'tasks' ? 'default' : 'ghost'}
              onClick={() => onPageChange('tasks')}
              className="text-lg"
            >
              Tasks
            </Button>
            <Button
              variant={currentPage === 'companies' ? 'default' : 'ghost'}
              onClick={() => onPageChange('companies')}
              className="text-lg"
            >
              Companies
            </Button>
            {onSave && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSave}
                className="ml-4"
              >
                <Save className="h-5 w-5" />
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="container py-8">
        {saveError && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive">
            <p>{saveError}</p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
} 