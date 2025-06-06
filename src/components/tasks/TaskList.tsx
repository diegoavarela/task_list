import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Building2, Calendar, CheckCircle2, Circle, ChevronDown, Download, Eye, EyeOff, ChevronRight, ChevronDown as ChevronDownIcon, X, GripVertical, Check, Hash } from 'lucide-react';
import type { Task } from '../../types/task';
import type { Company } from '../../types/company';
import type { Tag } from '../../types/tag';
import { TagSelector } from '@/components/tags/TagSelector';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
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
      isSubtask && "ml-8 border-l-2 border-gray-200 pl-4"
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
        <div className="flex items-start justify-between w-full gap-4">
          <div className="flex items-center gap-2 flex-1">
            <button
              {...attributes}
              {...listeners}
              className="hover:scale-110 transition-all duration-300 cursor-grab active:cursor-grabbing"
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
                "task-checkbox",
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
              </div>
              {viewMode === 'normal' && (
                <div className="task-meta">
                  {!isSubtask && (
                    <div 
                      className="task-company-badge"
                      style={{ 
                        backgroundColor: `${getCompanyColor(task.companyId)}15`,
                        color: getCompanyColor(task.companyId),
                        border: `1px solid ${getCompanyColor(task.companyId)}30`
                      }}
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      {getCompanyName(task.companyId)}
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
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium tag-badge"
                            style={{ 
                              backgroundColor: `${tag.color}15`,
                              color: tag.color,
                              border: `1px solid ${tag.color}30`
                            }}
                          >
                            <Hash className="h-2.5 w-2.5" />
                            {tag.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Due date for subtasks or created date for main tasks */}
                  <div className="task-date">
                    <Calendar className="h-3 w-3" />
                    {task.dueDate && isSubtask ? (
                      <span className={cn(
                        "text-xs",
                        new Date(task.dueDate) < new Date() && "due-date-overdue",
                        format(new Date(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "due-date-today"
                      )}>
                        Due {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    ) : (
                      format(new Date(task.createdAt), 'MMM d, yyyy')
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
                  {task.dueDate && isSubtask && (
                    <span className={cn(
                      new Date(task.dueDate) < new Date() && "text-red-500",
                      format(new Date(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "text-orange-500"
                    )}>
                      Due {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="task-actions flex items-center gap-2 shrink-0">
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
                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                  className="h-8 w-8"
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
                  className="h-8 w-8 text-destructive hover:text-destructive"
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
  setShowCompleted
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
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskTags, setNewSubtaskTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>('normal');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks || [];

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(task => task.companyId === selectedCompany);
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed);
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
  }, [tasks, selectedCompany, sortOrder, showCompleted]);

  const handleAddTask = () => {
    if (newTaskName.trim() && newTaskCompany) {
      const newTask: Omit<Task, 'id' | 'createdAt'> = {
        name: newTaskName.trim(),
        companyId: newTaskCompany,
        completed: false,
        subtasks: [],
        tagIds: newTaskTags,
        dueDate: new Date(newTaskDate)
      };
      onTaskAdd(newTask);
      setNewTaskName('');
      setNewTaskCompany('');
      setNewTaskDate(format(new Date(), 'yyyy-MM-dd'));
      setNewTaskTags([]);
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
        createdAt: new Date(editingTask.createdAt)
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

  const getCompanyName = (companyId: string) => {
    return companies?.find(c => c.id === companyId)?.name || 'Unknown Company';
  };

  const getCompanyColor = (companyId: string) => {
    return companies?.find(c => c.id === companyId)?.color || '#64748b';
  };

  const toggleTaskCompletion = (task: Task) => {
    const updatedTask: Task = {
      ...task,
      completed: !task.completed
    };
    onTaskUpdate(task.id, updatedTask);
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
        parentTaskId
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
    />
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Tasks</CardTitle>
            <div className="flex items-center gap-3">
              <Button
                variant={showAddTask ? "default" : "outline"}
                onClick={() => setShowAddTask(!showAddTask)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {showAddTask ? 'Cancel' : 'Add Task'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode(viewMode === 'normal' ? 'compact' : 'normal')}
                className="flex items-center gap-2"
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
                className="flex items-center gap-2"
                title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
              >
                {showCompleted ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </Button>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                <ChevronDown className={`h-4 w-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {showAddTask && (
              <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="What needs to be done?"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="text-base"
                      autoFocus
                    />
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-3">
                        <Select value={newTaskCompany} onValueChange={setNewTaskCompany}>
                          <SelectTrigger className="w-[200px]">
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
                        <Input
                          type="date"
                          value={newTaskDate}
                          onChange={(e) => setNewTaskDate(e.target.value)}
                          className="w-[160px]"
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
                      <div className="ml-8 space-y-2">
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
                      <div className="ml-8 mt-3">
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
                                <div className="flex gap-2">
                                  <Input
                                    type="date"
                                    value={newSubtaskDueDate}
                                    onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                                    placeholder="Due date (optional)"
                                    className="h-9 flex-1"
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
              <div className="empty-state">
                <CheckCircle2 className="empty-state-icon" />
                <h3 className="empty-state-title">
                  {showCompleted ? 'No tasks found' : 'No pending tasks'}
                </h3>
                <p className="empty-state-description">
                  {showCompleted 
                    ? 'Try adjusting your filters or add a new task.' 
                    : 'Get started by clicking "Add Task" above. Once you have tasks, you can add subtasks using the "+ Subtask" button on each task.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit {editingTask?.parentTaskId ? 'Subtask' : 'Task'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              value={editingTask?.name || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Task name"
              className="shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
            />
            {editingTask?.parentTaskId ? (
              <div className="space-y-3">
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
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
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
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
              <TagSelector
                tags={tags}
                selectedTagIds={editingTask?.tagIds || []}
                onTagsChange={(tagIds) => setEditingTask(prev => prev ? { ...prev, tagIds } : null)}
                placeholder="Add tags..."
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
        <DialogContent className="sm:max-w-[425px]">
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
    </div>
  );
} 