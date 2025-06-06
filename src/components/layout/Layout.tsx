import { Save, CheckSquare, Building2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import type { Task } from '@/types/task';
import type { Company } from '@/types/company';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentPage: 'tasks' | 'companies';
  onPageChange: (page: 'tasks' | 'companies') => void;
  onSave?: () => void;
  saveError?: string | null;
  tasks?: Task[];
  companies?: Company[];
  isSaving?: boolean;
  lastSaved?: Date | null;
}

function ExportDropdown({ tasks, companies }: { tasks?: Task[], companies?: Company[] }) {
  const { toast } = useToast();

  const handleExportJSON = () => {
    if (!tasks || !companies) return;
    
    const data = {
      tasks,
      companies,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-list-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your data has been exported as JSON.",
    });
  };

  const handleExportCSV = () => {
    if (!tasks || !companies) return;

    // Prepare tasks CSV
    const taskHeaders = ['ID', 'Name', 'Company', 'Created At', 'Completed', 'Parent Task ID'];
    const taskRows = tasks.map(task => [
      task.id,
      task.name,
      companies.find(c => c.id === task.companyId)?.name || 'Unknown Company',
      format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      task.completed ? 'Yes' : 'No',
      task.parentTaskId || ''
    ]);

    // Prepare companies CSV
    const companyHeaders = ['ID', 'Name', 'Created At', 'Color'];
    const companyRows = companies.map(company => [
      company.id,
      company.name,
      format(new Date(company.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      company.color
    ]);

    // Combine both CSVs
    const csvContent = [
      'TASKS',
      taskHeaders.join(','),
      ...taskRows.map(row => row.join(',')),
      '\nCOMPANIES',
      companyHeaders.join(','),
      ...companyRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-list-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your data has been exported as CSV.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <Download className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer">
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ 
  children, 
  currentPage, 
  onPageChange, 
  onSave, 
  saveError, 
  tasks, 
  companies,
  isSaving,
  lastSaved 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="header">
        <div className="header-content">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 text-primary relative"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div>
              <h1 className="header-title">The Freelo List</h1>
              {lastSaved && (
                <div className="text-xs text-muted-foreground">
                  Auto-saved {format(lastSaved, 'HH:mm:ss')}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="tabs-list">
              <button
                onClick={() => onPageChange('tasks')}
                className={`tabs-trigger ${
                  currentPage === 'tasks' ? 'data-[state=active]:bg-background' : ''
                }`}
                data-state={currentPage === 'tasks' ? 'active' : 'inactive'}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </button>
              <button
                onClick={() => onPageChange('companies')}
                className={`tabs-trigger ${
                  currentPage === 'companies' ? 'data-[state=active]:bg-background' : ''
                }`}
                data-state={currentPage === 'companies' ? 'active' : 'inactive'}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Companies
              </button>
            </nav>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <KeyboardShortcuts />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Keyboard shortcuts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ThemeToggle />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {onSave && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSave}
                        disabled={isSaving}
                        className="relative"
                      >
                        {isSaving ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <Save className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Save manually</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ExportDropdown tasks={tasks} companies={companies} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>
      <main className="container py-6 max-w-6xl">
        {saveError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm font-medium">{saveError}</p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
} 