import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { Task } from './types/task';
import type { Company } from './types/company';
import { TaskList } from './components/tasks/TaskList';
import { CompanyConfig } from './components/company/CompanyConfig';
import { Layout } from './components/layout/Layout';
import { saveTasks, loadTasks, saveCompanies, loadCompanies } from './lib/storage';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { useToast } from "@/components/ui/use-toast"

type Page = 'tasks' | 'companies';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedCompanies = loadCompanies();
    setTasks(loadedTasks);
    setCompanies(loadedCompanies);
  }, []);

  const debouncedSave = useCallback(
    async (newTasks: Task[], newCompanies: Company[]) => {
      try {
        setIsSaving(true);
        await saveTasks(newTasks);
        await saveCompanies(newCompanies);
        setLastSaved(new Date());
        setSaveError(null);
      } catch (error) {
        setSaveError('Failed to save changes. Please try again.');
        toast({
          title: "Save failed",
          description: "Failed to save changes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSave(tasks, companies);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [tasks, companies, debouncedSave]);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates };
      }
      // Check if this task has subtasks that need to be updated
      if (task.subtasks) {
        const updatedSubtasks = task.subtasks.map(subtask => 
          subtask.id === taskId ? { ...subtask, ...updates } : subtask
        );
        return { ...task, subtasks: updatedSubtasks };
      }
      return task;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleAddCompany = (company: Company) => {
    setCompanies(prev => [...prev, company]);
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies(prev => prev.map(company => 
      company.id === updatedCompany.id ? updatedCompany : company
    ));
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies(prev => prev.filter(company => company.id !== companyId));
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="task-list-theme">
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        onSave={() => debouncedSave(tasks, companies)}
        saveError={saveError}
        tasks={tasks}
        companies={companies}
        isSaving={isSaving}
        lastSaved={lastSaved}
      >
        {currentPage === 'tasks' ? (
          <TaskList
            tasks={tasks}
            companies={companies}
            onTaskAdd={handleAddTask}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            showAddTask={showAddTask}
            setShowAddTask={setShowAddTask}
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
          />
        ) : (
          <CompanyConfig
            companies={companies}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}
