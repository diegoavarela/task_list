import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Edit2, Building2, Calendar, CheckCircle2, Circle, ChevronDown, Download, Eye, EyeOff, ChevronRight, ChevronDown as ChevronDownIcon, X, GripVertical, Check, Hash, FileText, CheckSquare, Search, Filter, Tag as TagIcon, Zap, Repeat, Layers, Folder } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import type { Task } from '../../types/task';
import type { Company } from '../../types/company';
import type { Tag } from '../../types/tag';
import { TagSelector } from '@/components/tags/TagSelector';
import { FileAttachments } from './FileAttachments';
import { TaskDependencies } from './TaskDependencies';
import { SmartLists } from './SmartLists';
import { BulkOperations } from './BulkOperations';
import { RecurringTasks } from './RecurringTasks';
import { TaskTemplates } from './TaskTemplates';
import { CategoryManager } from '../categories/CategoryManager';
import { CategoryFilter } from '../categories/CategoryFilter';
import { RecurringTaskService } from '@/services/recurringTasks';
import type { TaskTemplate } from '@/lib/storage';
import type { Category } from '@/types/category';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { EmptyState } from '@/components/ui/empty-state';
import { format, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  companies: Company[];
  tags: Tag[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  showAddTask: boolean;
  setShowAddTask: (show: boolean) => void;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  templates: TaskTemplate[];
  onTemplateCreate: (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'useCount' | 'lastUsed'>) => void;
  onTemplateUpdate: (templateId: string, updates: Partial<TaskTemplate>) => void;
  onTemplateDelete: (templateId: string) => void;
  onTemplateUse: (template: TaskTemplate) => void;
  categories: Category[];
  onCategoryCreate: (category: Omit<Category, 'id' | 'createdAt' | 'order'>) => void;
  onCategoryUpdate: (categoryId: string, updates: Partial<Category>) => void;
  onCategoryDelete: (categoryId: string) => void;
}

interface SortableTaskProps {
  task: Task;
  isSubtask: boolean;
  onToggleExpansion: (taskId: string) => void;
  onToggleCompletion: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  expandedTasks: Set<string>;
  getCompanyName: (companyId: string) => string;
  getCompanyColor: (companyId: string) => string;
  tags: Tag[];
  viewMode: 'normal' | 'compact';
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onTaskSelection?: (taskId: string, selected: boolean) => void;
}

// Helper function to get date status
function getDateStatus(date: Date | string | undefined) {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = startOfDay(new Date());
  const dateDay = startOfDay(dateObj);
  
  if (isPast(dateDay) && !isToday(dateObj)) {
    return 'overdue';
  } else if (isToday(dateObj)) {
    return 'today';
  } else if (isTomorrow(dateObj)) {
    return 'tomorrow';
  }
  return 'upcoming';
}

// Helper function to format due date text
function formatDueDate(date: Date | string, time?: string) {
  const status = getDateStatus(date);
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeText = time ? ` at ${time}` : '';
  
  if (status === 'today') {
    return `Due Today${timeText}`;
  } else if (status === 'tomorrow') {
    return `Due Tomorrow${timeText}`;
  } else if (status === 'overdue') {
    return `Overdue (${format(dateObj, 'MMM d')}${timeText})`;
  }
  return `Due ${format(dateObj, 'MMM d')}${timeText}`;
}

function SortableTask({
  task,
  isSubtask,
  onToggleExpansion,
  onToggleCompletion,
  onEdit,
  onDelete,
  onAddSubtask,
  expandedTasks,
  getCompanyName,
  getCompanyColor,
  tags,
  viewMode,
  isSelectionMode = false,
  isSelected = false,
  onTaskSelection,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "space-y-2",
      isSubtask && "ml-4 sm:ml-8 border-l-2 border-gray-200 pl-3 sm:pl-4"
    )}>
      <div 
        className={cn(
          "task-item group",
          task.completed && 'completed',
          isSubtask && 'is-subtask'
        )}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) {
            if (!isSubtask && task.subtasks && task.subtasks.length > 0) {
              onToggleExpansion(task.id);
            } else {
              onEdit(task);
            }
          }
        }}
      >
        <div className="flex items-start justify-between w-full gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            {isSelectionMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onTaskSelection?.(task.id, e.target.checked);
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
            )}
            <button
              {...attributes}
              {...listeners}
              className="hover:scale-110 transition-all duration-300 cursor-grab active:cursor-grabbing hidden sm:block"
            >
              <GripVertical className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {!isSubtask && task.subtasks && task.subtasks.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpansion(task.id);
                      }}
                      className="hover:scale-110 transition-all duration-300"
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{expandedTasks.has(task.id) ? 'Collapse subtasks' : 'Expand subtasks'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompletion(task);
              }}
              className={cn(
                "task-checkbox touch-action-manipulation",
                isSubtask && "subtask-checkbox"
              )}
            >
              {task.completed && (
                <Check className="h-3 w-3 text-white" />
              )}
            </button>

            <div className="task-content">
              <div className="task-text">
                {task.name}
                {task.notes && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FileText className="h-3 w-3 ml-2 text-muted-foreground inline" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">{task.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {viewMode === 'normal' && (
                <div className="task-meta flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                  {/* Priority Badge */}
                  <PriorityBadge priority={task.priority} />
                  
                  {/* Status Badge */}
                  {task.status !== 'todo' && (
                    <StatusBadge status={task.status} />
                  )}
                  
                  {/* Recurring Indicator */}
                  {task.isRecurring && task.recurringPattern && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
                            <Repeat className="h-3 w-3" />
                            <span>Recurring</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{RecurringTaskService.getPatternDescription(task.recurringPattern)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {!isSubtask && (
                    <div 
                      className="task-company-badge whitespace-nowrap"
                      style={{ 
                        backgroundColor: `${getCompanyColor(task.companyId)}15`,
                        color: getCompanyColor(task.companyId),
                        border: `1px solid ${getCompanyColor(task.companyId)}30`
                      }}
                    >
                      <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{getCompanyName(task.companyId)}</span>
                    </div>
                  )}
                  
                  {/* Display tags */}
                  {task.tagIds && task.tagIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tagIds.map(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <div
                            key={tagId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tag-badge whitespace-nowrap"
                            style={{ 
                              backgroundColor: `${tag.color}15`,
                              color: tag.color,
                              border: `1px solid ${tag.color}30`
                            }}
                          >
                            <Hash className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate max-w-[80px] sm:max-w-none">{tag.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Due date for subtasks and main tasks, or created date for main tasks without due date */}
                  <div className="task-date whitespace-nowrap">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {task.dueDate ? (
                      <span className={cn(
                        "text-xs",
                        getDateStatus(task.dueDate) === 'overdue' && "due-date-overdue",
                        getDateStatus(task.dueDate) === 'today' && "due-date-today",
                        getDateStatus(task.dueDate) === 'tomorrow' && "due-date-tomorrow"
                      )}>
                        {formatDueDate(task.dueDate, task.dueTime)}
                      </span>
                    ) : (
                      <span className="text-xs">
                        {format(new Date(task.createdAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {viewMode === 'compact' && (
                <div className="task-meta-compact flex items-center gap-2 text-xs text-muted-foreground">
                  {!isSubtask && (
                    <span>{getCompanyName(task.companyId)}</span>
                  )}
                  {task.tagIds && task.tagIds.length > 0 && (
                    <span>• {task.tagIds.length} tag{task.tagIds.length > 1 ? 's' : ''}</span>
                  )}
                  {task.dueDate && (
                    <span className={cn(
                      getDateStatus(task.dueDate) === 'overdue' && "text-red-500",
                      getDateStatus(task.dueDate) === 'today' && "text-amber-500",
                      getDateStatus(task.dueDate) === 'tomorrow' && "text-amber-500"
                    )}>
                      {formatDueDate(task.dueDate, task.dueTime)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="task-actions flex items-center gap-1 sm:gap-2 shrink-0">
          {!isSubtask && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask(task.id);
                    }}
                    className="h-8 w-8 sm:h-8 sm:w-8 p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 touch-action-manipulation"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add subtask to this task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="h-8 w-8 sm:h-8 sm:w-8 p-1.5 sm:p-2 touch-action-manipulation"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="h-8 w-8 sm:h-8 sm:w-8 p-1.5 sm:p-2 text-destructive hover:text-destructive touch-action-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskList({
  tasks = [],
  companies = [],
  tags = [],
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  showAddTask,
  setShowAddTask,
  showCompleted,
  setShowCompleted,
  templates = [],
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateUse,
  categories = [],
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete
}: TaskListProps) {
  // Defensive check to prevent crashes
  if (!tasks || !companies || !tags) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCompany, setNewTaskCompany] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskAttachments, setNewTaskAttachments] = useState<Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: Date;
  }>>([]);
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
  const [newTaskRecurringPattern, setNewTaskRecurringPattern] = useState<{
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [smartListFilter, setSmartListFilter] = useState<((task: Task) => boolean) | null>(null);
  const [activeSmartList, setActiveSmartList] = useState<string | null>(null);
  const [showSmartLists, setShowSmartLists] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskDueTime, setNewSubtaskDueTime] = useState('');
  const [newSubtaskTags, setNewSubtaskTags] = useState<string[]>([]);
  const [newSubtaskNotes, setNewSubtaskNotes] = useState('');
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>('normal');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCompanyName = useCallback((companyId: string) => {
    return companies?.find(c => c.id === companyId)?.name || 'Unknown Company';
  }, [companies]);

  const getCompanyColor = useCallback((companyId: string) => {
    return companies?.find(c => c.id === companyId)?.color || '#64748b';
  }, [companies]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks || [];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => {
        // Search in task name
        if (task.name.toLowerCase().includes(query)) return true;
        
        // Search in task notes
        if (task.notes && task.notes.toLowerCase().includes(query)) return true;
        
        // Search in subtasks
        if (task.subtasks) {
          const hasMatchingSubtask = task.subtasks.some(subtask => 
            subtask.name.toLowerCase().includes(query) ||
            (subtask.notes && subtask.notes.toLowerCase().includes(query))
          );
          if (hasMatchingSubtask) return true;
        }
        
        // Search in company name
        const companyName = getCompanyName(task.companyId).toLowerCase();
        if (companyName.includes(query)) return true;
        
        // Search in tag names
        if (task.tagIds && task.tagIds.length > 0) {
          const hasMatchingTag = task.tagIds.some(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag && tag.name.toLowerCase().includes(query);
          });
          if (hasMatchingTag) return true;
        }
        
        return false;
      });
    }

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(task => task.companyId === selectedCompany);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(task => {
        if (!task.tagIds || task.tagIds.length === 0) return false;
        return selectedTags.every(tagId => task.tagIds!.includes(tagId));
      });
    }

    // Filter by category
    if (selectedCategoryId) {
      if (selectedCategoryId === 'uncategorized') {
        filtered = filtered.filter(task => !task.categoryId);
      } else {
        filtered = filtered.filter(task => task.categoryId === selectedCategoryId);
      }
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    // Apply smart list filter
    if (smartListFilter) {
      filtered = filtered.filter(smartListFilter);
    }

    // Sort by order if it exists, otherwise by date
    return [...filtered].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [tasks, selectedCompany, selectedTags, searchQuery, sortOrder, showCompleted, companies, tags, getCompanyName, smartListFilter, selectedCategoryId]);

  const handleSmartListFilter = (filterFn: (task: Task) => boolean, filterName: string) => {
    if (filterName === '') {
      // Clear filter
      setSmartListFilter(null);
      setActiveSmartList(null);
    } else {
      setSmartListFilter(() => filterFn);
      setActiveSmartList(filterName);
    }
  };

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTasks([]);
    }
  };

  const selectAllVisible = () => {
    const visibleTaskIds = filteredAndSortedTasks.map(task => task.id);
    setSelectedTasks(visibleTaskIds);
  };

  const clearSelection = () => {
    setSelectedTasks([]);
    setIsSelectionMode(false);
  };

  const handleAddTask = () => {
    if (newTaskName.trim() && newTaskCompany) {
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        name: newTaskName.trim(),
        companyId: newTaskCompany,
        categoryId: newTaskCategory || undefined,
        completed: false,
        subtasks: [],
        tagIds: newTaskTags,
        dueDate: new Date(newTaskDate),
        dueTime: newTaskTime || undefined,
        notes: newTaskNotes || undefined,
        attachments: newTaskAttachments.map(att => ({
          id: att.id,
          name: att.name,
          url: att.url,
          size: att.size,
          type: att.type,
          uploadedAt: att.uploadedAt,
          uploadedBy: 'current-user' // In a real app, get from auth context
        })),
        dependencies: newTaskDependencies,
        isRecurring: !!newTaskRecurringPattern,
        recurringPattern: newTaskRecurringPattern
      };
      onTaskAdd(newTask);
      setNewTaskName('');
      setNewTaskCompany('');
      setNewTaskCategory('');
      setNewTaskDate(format(new Date(), 'yyyy-MM-dd'));
      setNewTaskTime('');
      setNewTaskTags([]);
      setNewTaskNotes('');
      setNewTaskAttachments([]);
      setNewTaskDependencies([]);
      setNewTaskRecurringPattern(null);
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      });
    }
  };

  const handleEditTask = () => {
    if (editingTask && editingTask.name.trim()) {
      const updatedTask: Task = {
        ...editingTask,
        name: editingTask.name.trim(),
        completed: editingTask.completed,
        createdAt: new Date(editingTask.createdAt),
        notes: editingTask.notes
      };
      onTaskUpdate(editingTask.id, updatedTask);
      setEditingTask(null);
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      onTaskDelete(taskToDelete);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    }
  };

  const toggleTaskCompletion = (task: Task) => {
    const isCompleting = !task.completed;
    
    const updatedTask: Task = {
      ...task,
      completed: isCompleting,
      completedAt: isCompleting ? new Date() : undefined,
      status: isCompleting ? 'completed' : 'todo'
    };
    
    onTaskUpdate(task.id, updatedTask);

    // Generate next occurrence for recurring tasks when completed
    if (isCompleting && RecurringTaskService.shouldGenerateNext(task)) {
      const nextOccurrence = RecurringTaskService.generateNextOccurrence(task);
      if (nextOccurrence) {
        onTaskAdd(nextOccurrence);
        toast({
          title: "Recurring task completed",
          description: "Next occurrence has been scheduled automatically.",
        });
      }
    }
  };

  const handleExportJSON = () => {
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
    // Prepare tasks CSV
    const taskHeaders = ['ID', 'Name', 'Company', 'Created At', 'Completed', 'Parent Task ID'];
    const taskRows = tasks.map(task => [
      task.id,
      task.name,
      getCompanyName(task.companyId),
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

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAddSubtask = (parentTaskId: string) => {
    if (newSubtaskName.trim()) {
      const parentTask = tasks.find(t => t.id === parentTaskId);
      if (!parentTask) return;

      const newSubtask = {
        name: newSubtaskName.trim(),
        companyId: parentTask.companyId,
        completed: false,
        subtasks: [],
        parentTaskId,
        dueDate: newSubtaskDueDate ? new Date(newSubtaskDueDate) : undefined,
        dueTime: newSubtaskDueTime || undefined,
        tagIds: newSubtaskTags,
        notes: newSubtaskNotes || undefined
      };
      
      const updatedTask = {
        ...parentTask,
        subtasks: [...(parentTask.subtasks || []), {
          ...newSubtask,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }]
      };
      
      onTaskUpdate(parentTaskId, updatedTask);
      setNewSubtaskName('');
      setNewSubtaskDueDate('');
      setNewSubtaskDueTime('');
      setNewSubtaskTags([]);
      setNewSubtaskNotes('');
      setAddingSubtask(null);
      setExpandedTasks(prev => new Set([...prev, parentTaskId]));
      toast({
        title: "Subtask added",
        description: "Your subtask has been added successfully.",
      });
    }
  };

  const handleUpdateSubtask = (parentTaskId: string, subtaskId: string, updates: Partial<Task>) => {
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask || !parentTask.subtasks) return;

    const updatedSubtasks = parentTask.subtasks.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
    );

    const updatedTask: Task = {
      ...parentTask,
      subtasks: updatedSubtasks
    };

    onTaskUpdate(parentTaskId, updatedTask);
  };

  const handleDeleteSubtask = (parentTaskId: string, subtaskId: string) => {
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask || !parentTask.subtasks) return;

    const updatedSubtasks = parentTask.subtasks.filter(subtask => subtask.id !== subtaskId);
    const updatedTask: Task = {
      ...parentTask,
      subtasks: updatedSubtasks
    };

    onTaskUpdate(parentTaskId, updatedTask);
  };

  const toggleSubtaskCompletion = (parentTaskId: string, subtaskId: string) => {
    const parentTask = tasks.find(t => t.id === parentTaskId);
    if (!parentTask || !parentTask.subtasks) return;

    const updatedSubtasks = parentTask.subtasks.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    );

    const updatedTask: Task = {
      ...parentTask,
      subtasks: updatedSubtasks
    };

    onTaskUpdate(parentTaskId, updatedTask);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredAndSortedTasks.findIndex((task) => task.id === active.id);
      const newIndex = filteredAndSortedTasks.findIndex((task) => task.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Create a new array with the reordered tasks
        const newTasks = arrayMove(filteredAndSortedTasks, oldIndex, newIndex);
        
        // Update each task's order in the parent component
        newTasks.forEach((task, index) => {
          onTaskUpdate(task.id, { order: index });
        });
      }
    }
  };

  const handleSubtaskDragEnd = (parentTaskId: string, event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const parentTask = tasks.find(t => t.id === parentTaskId);
      if (!parentTask || !parentTask.subtasks) return;

      const oldIndex = parentTask.subtasks.findIndex((subtask) => subtask.id === active.id);
      const newIndex = parentTask.subtasks.findIndex((subtask) => subtask.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSubtasks = arrayMove(parentTask.subtasks, oldIndex, newIndex);
        const updatedTask = {
          ...parentTask,
          subtasks: newSubtasks.map((subtask, index) => ({
            ...subtask,
            order: index
          }))
        };
        
        onTaskUpdate(parentTaskId, updatedTask);
      }
    }
  };

  const renderTask = (task: Task, isSubtask: boolean = false) => (
    <SortableTask
      key={task.id}
      task={task}
      isSubtask={isSubtask}
      onToggleExpansion={toggleTaskExpansion}
      onToggleCompletion={toggleTaskCompletion}
      onEdit={setEditingTask}
      onDelete={handleDeleteTask}
      onAddSubtask={setAddingSubtask}
      expandedTasks={expandedTasks}
      getCompanyName={getCompanyName}
      getCompanyColor={getCompanyColor}
      tags={tags}
      viewMode={viewMode}
      isSelectionMode={isSelectionMode}
      isSelected={selectedTasks.includes(task.id)}
      onTaskSelection={handleTaskSelection}
    />
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-semibold">Tasks</CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <Button
                variant={showAddTask ? "default" : "outline"}
                onClick={() => setShowAddTask(!showAddTask)}
                className="flex items-center gap-2 touch-action-manipulation"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{showAddTask ? 'Cancel' : 'Add Task'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2 touch-action-manipulation"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
                {templates.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">{templates.length}</span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCategoryManager(true)}
                className="flex items-center gap-2 touch-action-manipulation"
              >
                <Folder className="h-4 w-4" />
                <span className="hidden sm:inline">Categories</span>
                {categories.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">{categories.length}</span>
                )}
              </Button>
              <Button
                variant={showSmartLists ? "default" : "outline"}
                onClick={() => setShowSmartLists(!showSmartLists)}
                className="flex items-center gap-2 touch-action-manipulation"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Smart Lists</span>
                {activeSmartList && (
                  <span className="bg-primary text-primary-foreground rounded-full w-2 h-2" />
                )}
              </Button>
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                onClick={toggleSelectionMode}
                className="flex items-center gap-2 touch-action-manipulation"
              >
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{isSelectionMode ? 'Cancel' : 'Select'}</span>
                {selectedTasks.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full w-2 h-2" />
                )}
              </Button>
              {isSelectionMode && (
                <Button
                  variant="outline"
                  onClick={selectAllVisible}
                  className="flex items-center gap-2 text-xs"
                  size="sm"
                >
                  Select All ({filteredAndSortedTasks.length})
                </Button>
              )}
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 touch-action-manipulation"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {(searchQuery || selectedCompany !== 'all' || selectedTags.length > 0 || selectedCategoryId) && (
                  <span className="bg-primary text-primary-foreground rounded-full w-2 h-2" />
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode(viewMode === 'normal' ? 'compact' : 'normal')}
                className="flex items-center gap-2 hidden sm:flex"
                title={`Switch to ${viewMode === 'normal' ? 'compact' : 'normal'} view`}
              >
                {viewMode === 'normal' ? (
                  <>📋 Normal</>
                ) : (
                  <>📋 Compact</>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 touch-action-manipulation"
                title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
              >
                {showCompleted ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{showCompleted ? 'Hide Completed' : 'Show Completed'}</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 hidden lg:flex"
              >
                <Calendar className="h-4 w-4" />
                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                <ChevronDown className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks, notes, companies, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      <Building2 className="h-4 w-4 inline mr-2" />
                      Company
                    </label>
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Companies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: company.color }}
                              />
                              {company.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Tag Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      <TagIcon className="h-4 w-4 inline mr-2" />
                      Tags (select multiple)
                    </label>
                    <div className="space-y-2">
                      {tags.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {tags.map((tag) => (
                            <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTags.includes(tag.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTags([...selectedTags, tag.id]);
                                  } else {
                                    setSelectedTags(selectedTags.filter(id => id !== tag.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <div
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${tag.color}15`,
                                  color: tag.color,
                                  border: `1px solid ${tag.color}30`
                                }}
                              >
                                <Hash className="h-2.5 w-2.5" />
                                {tag.name}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No tags available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      <Folder className="h-4 w-4 inline mr-2" />
                      Category
                    </label>
                    <CategoryFilter
                      categories={categories}
                      tasks={tasks}
                      selectedCategoryId={selectedCategoryId}
                      onCategorySelect={setSelectedCategoryId}
                      className="max-h-48 overflow-y-auto border rounded-lg p-2"
                    />
                  </div>
                </div>
                
                {/* Clear Filters */}
                {(searchQuery || selectedCompany !== 'all' || selectedTags.length > 0 || selectedCategoryId) && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCompany('all');
                        setSelectedTags([]);
                        setSelectedCategoryId(null);
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Always show quick stats summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {tasks.filter(t => !t.completed && !t.isArchived).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => t.completed).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {tasks.filter(t => {
                        if (!t.dueDate || t.completed) return false;
                        const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
                        return isPast(startOfDay(dueDate)) && !isToday(dueDate);
                      }).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {tasks.filter(t => {
                        if (!t.dueDate || t.completed) return false;
                        const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
                        return isToday(dueDate);
                      }).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Due Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {showSmartLists && (
              <SmartLists
                tasks={tasks}
                onFilterChange={handleSmartListFilter}
                activeFilter={activeSmartList}
              />
            )}
            {isSelectionMode && (
              <BulkOperations
                selectedTasks={selectedTasks}
                tasks={tasks}
                companies={companies}
                tags={tags}
                onTaskUpdate={onTaskUpdate}
                onTaskDelete={onTaskDelete}
                onClearSelection={clearSelection}
              />
            )}
            {showAddTask && (
              <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="What needs to be done?"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="text-base w-full"
                      autoFocus
                    />
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={newTaskCompany} onValueChange={setNewTaskCompany}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={newTaskCategory || "none"} onValueChange={(value) => setNewTaskCategory(value === "none" ? "" : value)}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select category (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={newTaskDate}
                          onChange={(e) => setNewTaskDate(e.target.value)}
                          className="w-full sm:w-[140px]"
                        />
                        <Input
                          type="time"
                          value={newTaskTime}
                          onChange={(e) => setNewTaskTime(e.target.value)}
                          placeholder="Optional time"
                          className="w-full sm:w-[120px]"
                        />
                        <Button 
                          onClick={() => {
                            handleAddTask();
                            setShowAddTask(false);
                          }}
                          disabled={!newTaskName.trim() || !newTaskCompany}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Task
                        </Button>
                      </div>
                      <TagSelector
                        tags={tags}
                        selectedTagIds={newTaskTags}
                        onTagsChange={setNewTaskTags}
                        placeholder="Add tags..."
                      />
                      <Textarea
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        placeholder="Add notes or comments about this task..."
                        className="shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                        rows={2}
                      />
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Attachments</label>
                        <FileAttachments
                          attachments={newTaskAttachments}
                          onAttachmentsChange={setNewTaskAttachments}
                          maxFileSize={10}
                          allowedTypes={['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx']}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Dependencies</label>
                        <TaskDependencies
                          currentTask={{ 
                            id: 'new-task', 
                            name: newTaskName || 'New Task',
                            companyId: newTaskCompany,
                            completed: false,
                            createdAt: new Date(),
                            priority: 'medium',
                            status: 'todo'
                          } as Task}
                          allTasks={tasks}
                          dependencies={newTaskDependencies}
                          onDependenciesChange={setNewTaskDependencies}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Recurring Pattern</label>
                        <RecurringTasks
                          pattern={newTaskRecurringPattern}
                          onPatternChange={setNewTaskRecurringPattern}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredAndSortedTasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredAndSortedTasks.map((task) => (
                  <div key={task.id}>
                    {renderTask(task)}
                    {!task.parentTaskId && expandedTasks.has(task.id) && task.subtasks && task.subtasks.length > 0 && (
                      <div className="ml-4 sm:ml-8 space-y-2">
                        <div className="subtask-list">
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleSubtaskDragEnd(task.id, event)}
                          >
                            <SortableContext
                              items={task.subtasks.map(subtask => subtask.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {task.subtasks.map(subtask => (
                                <SortableTask
                                  key={subtask.id}
                                  task={subtask}
                                  isSubtask={true}
                                  onToggleExpansion={toggleTaskExpansion}
                                  onToggleCompletion={(subtask) => toggleSubtaskCompletion(task.id, subtask.id)}
                                  onEdit={setEditingTask}
                                  onDelete={(subtaskId) => handleDeleteSubtask(task.id, subtaskId)}
                                  onAddSubtask={() => {}}
                                  expandedTasks={expandedTasks}
                                  getCompanyName={getCompanyName}
                                  getCompanyColor={getCompanyColor}
                                  tags={tags}
                                  viewMode={viewMode}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        </div>
                      </div>
                    )}
                    {!task.parentTaskId && addingSubtask === task.id && (
                      <div className="ml-4 sm:ml-8 mt-3">
                        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <Input
                                type="text"
                                value={newSubtaskName}
                                onChange={(e) => setNewSubtaskName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newSubtaskName.trim()) {
                                    handleAddSubtask(task.id);
                                  }
                                }}
                                placeholder="Add a subtask..."
                                className="h-9"
                                autoFocus
                              />
                              <div className="grid grid-cols-1 gap-3">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    type="date"
                                    value={newSubtaskDueDate}
                                    onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                                    placeholder="Due date (optional)"
                                    className="h-9 w-full sm:flex-1"
                                  />
                                  <Input
                                    type="time"
                                    value={newSubtaskDueTime}
                                    onChange={(e) => setNewSubtaskDueTime(e.target.value)}
                                    placeholder="Time (optional)"
                                    className="h-9 w-full sm:w-[120px]"
                                  />
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleAddSubtask(task.id)}
                                    disabled={!newSubtaskName.trim()}
                                    className="gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAddingSubtask(null);
                                      setNewSubtaskName('');
                                      setNewSubtaskDueDate('');
                                      setNewSubtaskDueTime('');
                                      setNewSubtaskTags([]);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                <TagSelector
                                  tags={tags}
                                  selectedTagIds={newSubtaskTags}
                                  onTagsChange={setNewSubtaskTags}
                                  placeholder="Add tags to subtask..."
                                />
                                <Textarea
                                  value={newSubtaskNotes}
                                  onChange={(e) => setNewSubtaskNotes(e.target.value)}
                                  placeholder="Add notes to subtask..."
                                  className="shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))}
              </SortableContext>
            </DndContext>
            
            {filteredAndSortedTasks.length === 0 && (
              <EmptyState
                icon={<CheckSquare className="h-full w-full" />}
                title="No tasks yet"
                description="Create your first task to get started with organizing your work."
                action={{
                  label: "Add Task",
                  onClick: () => setShowAddTask(true)
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="w-[95vw] max-w-[425px] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit {editingTask?.parentTaskId ? 'Subtask' : 'Task'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 dialog-body">
            <Input
              value={editingTask?.name || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Task name"
              className="shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
            />
            {editingTask?.parentTaskId ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
                    <Input
                      type="date"
                      value={editingTask?.dueDate ? format(new Date(editingTask.dueDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => setEditingTask(prev => prev ? { 
                        ...prev, 
                        dueDate: e.target.value ? new Date(e.target.value) : undefined
                      } : null)}
                      placeholder="Due date (optional)"
                      className="h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Due Time</label>
                    <Input
                      type="time"
                      value={editingTask?.dueTime || ''}
                      onChange={(e) => setEditingTask(prev => prev ? { 
                        ...prev, 
                        dueTime: e.target.value || undefined
                      } : null)}
                      placeholder="Optional time"
                      className="h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Company</label>
                    <select
                      value={editingTask?.companyId || ''}
                      onChange={(e) => setEditingTask(prev => prev ? { ...prev, companyId: e.target.value } : null)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    >
                      <option value="">Select company</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                    <Select 
                      value={editingTask?.categoryId || "none"} 
                      onValueChange={(value) => setEditingTask(prev => prev ? { 
                        ...prev, 
                        categoryId: value === "none" ? undefined : value 
                      } : null)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Created Date</label>
                    <Input
                      type="date"
                      value={editingTask?.createdAt ? format(new Date(editingTask.createdAt), 'yyyy-MM-dd') : ''}
                      onChange={(e) => setEditingTask(prev => prev ? { 
                        ...prev, 
                        createdAt: new Date(e.target.value)
                      } : null)}
                      className="h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label>
                    <Input
                      type="date"
                      value={editingTask?.dueDate ? format(new Date(editingTask.dueDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => setEditingTask(prev => prev ? { 
                        ...prev, 
                        dueDate: e.target.value ? new Date(e.target.value) : undefined
                      } : null)}
                      placeholder="Due date (optional)"
                      className="h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Due Time</label>
                    <Input
                      type="time"
                      value={editingTask?.dueTime || ''}
                      onChange={(e) => setEditingTask(prev => prev ? { 
                        ...prev, 
                        dueTime: e.target.value || undefined
                      } : null)}
                      placeholder="Optional time"
                      className="h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}
            <>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
              <TagSelector
                tags={tags}
                selectedTagIds={editingTask?.tagIds || []}
                onTagsChange={(tagIds) => setEditingTask(prev => prev ? { ...prev, tagIds } : null)}
                placeholder="Add tags..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
              <Textarea
                value={editingTask?.notes || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="Add notes or comments about this task..."
                className="shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingTask?.completed || false}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, completed: e.target.checked } : null)}
                className="h-4 w-4 rounded border-gray-300 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
              />
              <label>Mark as completed</label>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Attachments</label>
              <FileAttachments
                attachments={editingTask?.attachments?.map(att => ({
                  id: att.id,
                  name: att.name,
                  size: att.size,
                  type: att.type,
                  url: att.url,
                  uploadedAt: att.uploadedAt
                })) || []}
                onAttachmentsChange={(attachments) => {
                  setEditingTask(prev => prev ? { 
                    ...prev, 
                    attachments: attachments.map(att => ({
                      id: att.id,
                      name: att.name,
                      url: att.url,
                      size: att.size,
                      type: att.type,
                      uploadedAt: att.uploadedAt,
                      uploadedBy: 'current-user' // In a real app, get from auth context
                    }))
                  } : null);
                }}
                maxFileSize={10}
                allowedTypes={['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx']}
              />
            </div>
            {!editingTask?.parentTaskId && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Dependencies</label>
                <TaskDependencies
                  currentTask={editingTask}
                  allTasks={tasks}
                  dependencies={editingTask?.dependencies || []}
                  onDependenciesChange={(dependencies) => {
                    setEditingTask(prev => prev ? { ...prev, dependencies } : null);
                  }}
                />
              </div>
            )}
            {!editingTask?.parentTaskId && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Recurring Pattern</label>
                <RecurringTasks
                  pattern={editingTask?.recurringPattern || null}
                  onPatternChange={(pattern) => {
                    setEditingTask(prev => prev ? { 
                      ...prev, 
                      recurringPattern: pattern,
                      isRecurring: !!pattern
                    } : null);
                  }}
                />
              </div>
            )}
            </>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingTask(null)}
              className="hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditTask}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:scale-[1.02]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] sm:w-full">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="hover:bg-gray-100 transition-all duration-300 hover:scale-[1.02]"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTask}
              className="hover:bg-red-600 transition-all duration-300 hover:scale-[1.02]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showTemplates && (
        <TaskTemplates
          templates={templates}
          companies={companies}
          tags={tags}
          onTemplateCreate={onTemplateCreate}
          onTemplateUpdate={onTemplateUpdate}
          onTemplateDelete={onTemplateDelete}
          onTemplateUse={onTemplateUse}
          onClose={() => setShowTemplates(false)}
        />
      )}
      
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          tasks={tasks}
          onCategoryCreate={onCategoryCreate}
          onCategoryUpdate={onCategoryUpdate}
          onCategoryDelete={onCategoryDelete}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
} 