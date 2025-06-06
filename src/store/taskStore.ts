import { create } from 'zustand';
import { ApiTask, tasksApi } from '../lib/api';

interface TaskFilters {
  search: string;
  companyId: string;
  categoryId: string;
  assignedTo: string;
  priority: string;
  status: string;
  tags: string[];
  includeCompleted: boolean;
  includeArchived: boolean;
}

interface TaskState {
  tasks: ApiTask[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  selectedTasks: string[];
  
  // Actions
  setTasks: (tasks: ApiTask[]) => void;
  addTask: (task: ApiTask) => void;
  updateTask: (id: string, updates: Partial<ApiTask>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filters
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  
  // Selection
  selectTask: (id: string) => void;
  selectTasks: (ids: string[]) => void;
  deselectTask: (id: string) => void;
  clearSelection: () => void;
  toggleTaskSelection: (id: string) => void;
  
  // API Actions
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<ApiTask>) => Promise<void>;
  updateTaskById: (id: string, data: Partial<ApiTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  bulkUpdateTasks: (taskIds: string[], updates: Partial<ApiTask>) => Promise<void>;
}

const initialFilters: TaskFilters = {
  search: '',
  companyId: 'all',
  categoryId: 'all',
  assignedTo: 'all',
  priority: 'all',
  status: 'all',
  tags: [],
  includeCompleted: true,
  includeArchived: false,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filters: initialFilters,
  selectedTasks: [],

  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [task, ...state.tasks] 
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  clearFilters: () => set({ filters: initialFilters }),

  selectTask: (id) => set((state) => ({
    selectedTasks: [...state.selectedTasks, id]
  })),

  selectTasks: (ids) => set({ selectedTasks: ids }),

  deselectTask: (id) => set((state) => ({
    selectedTasks: state.selectedTasks.filter(taskId => taskId !== id)
  })),

  clearSelection: () => set({ selectedTasks: [] }),

  toggleTaskSelection: (id) => set((state) => ({
    selectedTasks: state.selectedTasks.includes(id)
      ? state.selectedTasks.filter(taskId => taskId !== id)
      : [...state.selectedTasks, id]
  })),

  // API Actions
  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const { filters } = get();
      
      const params = {
        search: filters.search || undefined,
        companyId: filters.companyId !== 'all' ? filters.companyId : undefined,
        categoryId: filters.categoryId !== 'all' ? filters.categoryId : undefined,
        assignedTo: filters.assignedTo !== 'all' ? filters.assignedTo : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        includeCompleted: filters.includeCompleted,
        includeArchived: filters.includeArchived,
      };

      const response = await tasksApi.getAll(params);
      set({ tasks: response.tasks || response, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false 
      });
    }
  },

  createTask: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const newTask = await tasksApi.create(data);
      set((state) => ({ 
        tasks: [newTask, ...state.tasks],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false 
      });
      throw error;
    }
  },

  updateTaskById: async (id, data) => {
    try {
      set({ error: null });
      const updatedTask = await tasksApi.update(id, data);
      set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? updatedTask : task
        )
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task'
      });
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      set({ error: null });
      await tasksApi.delete(id);
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        selectedTasks: state.selectedTasks.filter(taskId => taskId !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task'
      });
      throw error;
    }
  },

  bulkUpdateTasks: async (taskIds, updates) => {
    try {
      set({ isLoading: true, error: null });
      await tasksApi.bulkUpdate(taskIds, updates);
      
      // Update local state
      set((state) => ({
        tasks: state.tasks.map(task => 
          taskIds.includes(task.id) ? { ...task, ...updates } : task
        ),
        selectedTasks: [],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to bulk update tasks',
        isLoading: false 
      });
      throw error;
    }
  },
}));