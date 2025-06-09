import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import type { Task } from './types/task';
import type { Company } from './types/company';
import type { Tag } from './types/tag';
import type { Category } from './types/category';
import { TaskList } from './components/tasks/TaskList';
import { CompanyConfig } from './components/company/CompanyConfig';
import { TagsPage } from './pages/Tags';
import { CalendarPage } from './pages/CalendarPage';
import { TaskAnalytics } from './components/analytics/TaskAnalytics';
import { BillingPage } from './components/billing/BillingPage';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { saveTasks, loadTasks, saveCompanies, loadCompanies, saveTags, loadTags, saveTemplates, loadTemplates, saveCategories, loadCategories, type TaskTemplate } from './lib/storage';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { useToast } from "@/components/ui/use-toast"
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { NotificationService } from './services/notificationService';
import type { Notification } from './types/notification';
import { MockAuthService } from './lib/mockAuth';

type Page = 'tasks' | 'companies' | 'tags' | 'calendar' | 'analytics' | 'billing';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const { toast } = useToast();

  const shortcuts = [
    {
      key: '⌘/Ctrl + N',
      callback: () => setShowAddTask(true),
      description: 'Add new task'
    },
    {
      key: '⌘/Ctrl + F',
      callback: () => setShowFilters(prev => !prev),
      description: 'Toggle filters'
    },
    {
      key: '⌘/Ctrl + G',
      callback: () => setGroupByCategory(prev => !prev),
      description: 'Toggle group by category'
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
    },
    {
      key: '⌘/Ctrl + 4',
      callback: () => setCurrentPage('calendar'),
      description: 'Switch to Calendar page'
    },
    {
      key: '⌘/Ctrl + 5',
      callback: () => setCurrentPage('analytics'),
      description: 'Switch to Analytics page'
    },
    {
      key: '⌘/Ctrl + 6',
      callback: () => setCurrentPage('billing'),
      description: 'Switch to Billing page'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    // Check for existing auth token in localStorage
    const storedToken = localStorage.getItem('authToken');
    const storedTenantId = localStorage.getItem('tenantId');
    
    if (storedToken && storedTenantId) {
      // Validate token is still valid
      MockAuthService.verifyToken(storedToken)
        .then(() => {
          setAuthToken(storedToken);
          setTenantId(storedTenantId);
          setIsAuthenticated(true);
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('tenantId');
        });
    }
    
    try {
      const loadedTasks = loadTasks();
      const loadedCompanies = loadCompanies();
      const loadedTags = loadTags();
      const loadedTemplates = loadTemplates();
      const loadedCategories = loadCategories();
      setTasks(loadedTasks || []);
      setCompanies(loadedCompanies || []);
      setTags(loadedTags || []);
      setTemplates(loadedTemplates || []);
      setCategories(loadedCategories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays as fallback
      setTasks([]);
      setCompanies([]);
      setTags([]);
      setTemplates([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize notification service
  useEffect(() => {
    // Request notification permission on first load
    NotificationService.requestPermission();
    
    // Start monitoring for notifications
    NotificationService.startMonitoring(tasks);
    
    // Clear old notifications
    NotificationService.clearOldNotifications();
    
    // Subscribe to notifications
    const unsubscribe = NotificationService.onNotification((notification: Notification) => {
      // Show toast for new notifications
      toast({
        title: notification.title,
        description: notification.message,
      });
    });
    
    return () => {
      NotificationService.stopMonitoring();
      unsubscribe();
    };
  }, [tasks, toast]);

  const debouncedSave = useCallback(
    async (newTasks: Task[], newCompanies: Company[], newTags: Tag[], newTemplates?: TaskTemplate[], newCategories?: Category[]) => {
      try {
        setIsSaving(true);
        await saveTasks(newTasks);
        await saveCompanies(newCompanies);
        await saveTags(newTags);
        if (newTemplates) {
          await saveTemplates(newTemplates);
        }
        if (newCategories) {
          await saveCategories(newCategories);
        }
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
      debouncedSave(tasks, companies, tags, templates, categories);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [tasks, companies, tags, templates, categories, debouncedSave]);

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      priority: 'medium',
      status: 'todo',
      completed: false,
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

  const handleAddTemplate = (templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'useCount' | 'lastUsed'>) => {
    const newTemplate: TaskTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      useCount: 0
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleUpdateTemplate = (templateId: string, updates: Partial<TaskTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId ? { ...template, ...updates } : template
    ));
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    // Create new task from template
    const newTask: Omit<Task, 'id' | 'createdAt'> = {
      ...template.templateData,
      completed: false,
      isTemplate: false
    };
    
    handleAddTask(newTask);
    
    // Update template usage stats
    handleUpdateTemplate(template.id, {
      useCount: template.useCount + 1,
      lastUsed: new Date()
    });
  };

  const handleAddCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'order'>) => {
    const maxOrder = Math.max(0, ...categories.map(c => c.order || 0));
    const newCategory: Category = {
      ...categoryData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      order: maxOrder + 1
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (categoryId: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId ? { ...category, ...updates } : category
    ));
  };

  const handleDeleteCategory = (categoryId: string) => {
    // Remove category from all tasks
    setTasks(prev => prev.map(task => ({
      ...task,
      categoryId: task.categoryId === categoryId ? undefined : task.categoryId
    })));
    
    // Delete the category
    setCategories(prev => prev.filter(category => category.id !== categoryId));
  };

  const handleLogin = (token: string, tenant: string) => {
    setAuthToken(token);
    setTenantId(tenant);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', token);
    localStorage.setItem('tenantId', tenant);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setTenantId(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('tenantId');
    // Clear local data
    setTasks([]);
    setCompanies([]);
    setTags([]);
    setTemplates([]);
    setCategories([]);
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
          'Authorization': authToken ? `Bearer ${authToken}` : '',
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
  }, [tasks, companies, tags, isSaving, toast, authToken]);

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

  if (!isAuthenticated) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="task-list-theme">
        <Login onLogin={handleLogin} />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="task-list-theme">
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        onSave={() => debouncedSave(tasks, companies, tags, templates, categories)}
        saveError={saveError}
        tasks={tasks}
        companies={companies}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onLogout={handleLogout}
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
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            groupByCategory={groupByCategory}
            setGroupByCategory={setGroupByCategory}
            templates={templates}
            onTemplateCreate={handleAddTemplate}
            onTemplateUpdate={handleUpdateTemplate}
            onTemplateDelete={handleDeleteTemplate}
            onTemplateUse={handleUseTemplate}
            categories={categories}
            onCategoryCreate={handleAddCategory}
            onCategoryUpdate={handleUpdateCategory}
            onCategoryDelete={handleDeleteCategory}
          />
        ) : currentPage === 'companies' ? (
          <CompanyConfig
            companies={companies}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        ) : currentPage === 'tags' ? (
          <TagsPage
            tags={tags}
            onAddTag={handleAddTag}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
          />
        ) : currentPage === 'calendar' ? (
          <CalendarPage
            tasks={tasks}
            onTaskEdit={(task) => {
              // Navigate to tasks and edit the selected task
              setCurrentPage('tasks');
              // You could add logic here to open the edit dialog for the selected task
            }}
          />
        ) : currentPage === 'analytics' ? (
          <TaskAnalytics tasks={tasks} />
        ) : currentPage === 'billing' ? (
          <BillingPage />
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
