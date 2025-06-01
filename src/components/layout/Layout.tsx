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
          className="hover:bg-foreground hover:text-background transition-all duration-300 hover:scale-110"
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <h1 className="text-2xl font-bold">The Freelo List</h1>
            </div>
            {lastSaved && (
              <div className="text-xs text-muted-foreground mt-1">
                Last saved {format(lastSaved, 'HH:mm:ss')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <nav className="flex items-center gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onPageChange('tasks')}
                      className={`text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                        currentPage === 'tasks' 
                          ? 'border-2 border-foreground text-foreground hover:bg-foreground hover:text-background' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      } px-4 py-2 rounded-md`}
                    >
                      <CheckSquare className="h-4 w-4" />
                      Tasks
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View and manage tasks</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onPageChange('companies')}
                      className={`text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                        currentPage === 'companies' 
                          ? 'border-2 border-foreground text-foreground hover:bg-foreground hover:text-background' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      } px-4 py-2 rounded-md`}
                    >
                      <Building2 className="h-4 w-4" />
                      Companies
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage companies</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </nav>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <KeyboardShortcuts />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Keyboard shortcuts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ThemeToggle />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ExportDropdown tasks={tasks} companies={companies} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onSave}
                      variant="ghost"
                      size="icon"
                      className="hover:bg-foreground hover:text-background transition-all duration-300 hover:scale-110"
                      disabled={!onSave || isSaving}
                    >
                      {isSaving ? (
                        <Save className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save changes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
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