import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { Task } from './types/task';
import type { Company } from './types/company';
import type { Tag } from './types/tag';
import { TaskList } from './components/tasks/TaskList';
import { CompanyConfig } from './components/company/CompanyConfig';
import { TagsPage } from './pages/Tags';
import { Layout } from './components/layout/Layout';
import { saveTasks, loadTasks, saveCompanies, loadCompanies, saveTags, loadTags } from './lib/storage';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { useToast } from "@/components/ui/use-toast"
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

type Page = 'tasks' | 'companies' | 'tags';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  const shortcuts = [
    {
      key: '⌘/Ctrl + N',
      callback: () => setShowAddTask(true),
      description: 'Add new task'
    },
    {
      key: '⌘/Ctrl + S',
      callback: () => handleSave(),
      description: 'Save changes'
    },
    {
      key: '⌘/Ctrl + H',
      callback: () => setShowCompleted(!showCompleted),
      description: 'Toggle completed tasks'
    },
    {
      key: '⌘/Ctrl + 1',
      callback: () => setCurrentPage('tasks'),
      description: 'Switch to Tasks page'
    },
    {
      key: '⌘/Ctrl + 2',
      callback: () => setCurrentPage('companies'),
      description: 'Switch to Companies page'
    },
    {
      key: '⌘/Ctrl + 3',
      callback: () => setCurrentPage('tags'),
      description: 'Switch to Tags page'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    try {
      const loadedTasks = loadTasks();
      const loadedCompanies = loadCompanies();
      const loadedTags = loadTags();
      setTasks(loadedTasks || []);
      setCompanies(loadedCompanies || []);
      setTags(loadedTags || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays as fallback
      setTasks([]);
      setCompanies([]);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSave = useCallback(
    async (newTasks: Task[], newCompanies: Company[], newTags: Tag[]) => {
      try {
        setIsSaving(true);
        await saveTasks(newTasks);
        await saveCompanies(newCompanies);
        await saveTags(newTags);
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
      debouncedSave(tasks, companies, tags);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [tasks, companies, tags, debouncedSave]);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      // If we're updating the order, we need to reorder the entire array
      if (updates.order !== undefined) {
        const taskToUpdate = prev.find(t => t.id === taskId);
        if (!taskToUpdate) return prev;

        // Remove the task from its current position
        const filteredTasks = prev.filter(t => t.id !== taskId);
        
        // Insert the task at its new position
        const newTasks = [
          ...filteredTasks.slice(0, updates.order),
          { ...taskToUpdate, ...updates },
          ...filteredTasks.slice(updates.order)
        ];

        return newTasks;
      }

      // For other updates, update the task in place
      return prev.map(task => {
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
      });
    });
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

  const handleAddTag = (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
    const newTag: Tag = {
      ...tagData,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setTags(prev => [...prev, newTag]);
  };

  const handleUpdateTag = (tagId: string, updates: Partial<Tag>) => {
    setTags(prev => prev.map(tag => 
      tag.id === tagId ? { ...tag, ...updates } : tag
    ));
  };

  const handleDeleteTag = (tagId: string) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    // Remove tag from all tasks and subtasks
    setTasks(prev => prev.map(task => ({
      ...task,
      tagIds: task.tagIds?.filter(id => id !== tagId),
      subtasks: task.subtasks?.map(subtask => ({
        ...subtask,
        tagIds: subtask.tagIds?.filter(id => id !== tagId)
      }))
    })));
  };

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks, companies, tags }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save changes');
      }
      
      setLastSaved(new Date());
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
      toast({
        title: "Error saving changes",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [tasks, companies, tags, isSaving, toast]);

  // Show loading state to prevent white screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="task-list-theme">
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        onSave={() => debouncedSave(tasks, companies, tags)}
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
            tags={tags}
            onTaskAdd={handleAddTask}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            showAddTask={showAddTask}
            setShowAddTask={setShowAddTask}
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
          />
        ) : currentPage === 'companies' ? (
          <CompanyConfig
            companies={companies}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        ) : (
          <TagsPage
            tags={tags}
            onAddTag={handleAddTag}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
          />
        )}
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}
