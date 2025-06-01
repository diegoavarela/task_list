import { Save, CheckSquare, Building2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import type { Task } from '@/types/task';
import type { Company } from '@/types/company';

interface LayoutProps {
  currentPage: 'tasks' | 'companies';
  onPageChange: (page: 'tasks' | 'companies') => void;
  children: React.ReactNode;
  onSave?: () => void;
  saveError?: string | null;
  tasks?: Task[];
  companies?: Company[];
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
          variant="outline"
          size="icon"
          className="ml-4 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-110"
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

export function Layout({ currentPage, onPageChange, children, onSave, saveError, tasks, companies }: LayoutProps) {
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
      <header className="sticky top-0 z-50 w-full border-b bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 shadow-lg">
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
              className="h-8 w-8 text-black"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <h1 className="text-2xl font-bold text-black">The Freelo List</h1>
          </div>
          <nav className="ml-auto flex gap-4">
            <Button
              variant={currentPage === 'tasks' ? 'default' : 'ghost'}
              onClick={() => onPageChange('tasks')}
              className={`text-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                currentPage === 'tasks' 
                  ? 'border-2 border-black text-black hover:bg-black hover:text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <CheckSquare className="h-5 w-5" />
              Tasks
            </Button>
            <Button
              variant={currentPage === 'companies' ? 'default' : 'ghost'}
              onClick={() => onPageChange('companies')}
              className={`text-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                currentPage === 'companies' 
                  ? 'border-2 border-black text-black hover:bg-black hover:text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Building2 className="h-5 w-5" />
              Companies
            </Button>
            {onSave && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSave}
                className="ml-4 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Save className="h-5 w-5" />
              </Button>
            )}
            <ExportDropdown tasks={tasks} companies={companies} />
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