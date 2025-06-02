import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Building2, Calendar, CheckCircle2, Circle, ChevronDown, Download, Eye, EyeOff, ChevronRight, ChevronDown as ChevronDownIcon, X, GripVertical, Check } from 'lucide-react';
import type { Task } from '../../types/task';
import type { Company } from '../../types/company';
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
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div 
        className={`flex items-center justify-between p-4 rounded-lg border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:border-gray-400 hover:scale-[1.02] hover:bg-gray-50/80 cursor-pointer group ${
          task.completed ? 'animate-complete' : ''
        }`}
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
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="hover:scale-110 transition-all duration-300 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
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
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{expandedTasks.has(task.id) ? 'Collapse subtasks' : 'Expand subtasks'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              task.completed && "animate-complete"
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompletion(task);
              }}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                task.completed
                  ? "border-green-500 bg-green-500"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              {task.completed && (
                <Check className="w-3 h-3 text-white animate-check" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium transition-all duration-300 ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.name}
            </span>
            {!isSubtask && (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${getCompanyColor(task.companyId)}20`,
                  color: getCompanyColor(task.companyId),
                  border: `1px solid ${getCompanyColor(task.companyId)}40`
                }}
              >
                <Building2 className="h-3 w-3" />
                <span>{getCompanyName(task.companyId)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSubtask && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask(task.id);
                    }}
                    className="hover:scale-110 transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add subtask</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="hover:scale-110 transition-all duration-300"
                >
                  <Edit2 className="h-4 w-4 text-gray-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="hover:scale-110 transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete task</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  companies,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  showAddTask,
  setShowAddTask,
  showCompleted,
  setShowCompleted
}: TaskListProps) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCompany, setNewTaskCompany] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

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
        subtasks: []
      };
      onTaskAdd(newTask);
      setNewTaskName('');
      setNewTaskCompany('');
      setNewTaskDate(format(new Date(), 'yyyy-MM-dd'));
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
    return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
  };

  const getCompanyColor = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.color || '#64748b';
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
    />
  );

  return (
    <div className="space-y-8">
      <Card className="rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
        <CardHeader className="bg-gradient-to-r from-background to-background/95 rounded-t-lg border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowAddTask(!showAddTask)}
                className={`flex items-center gap-2 h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400 hover:scale-[1.02] ${
                  showAddTask ? 'bg-foreground text-background hover:bg-foreground/90' : ''
                }`}
              >
                <Plus className="h-4 w-4" />
                {showAddTask ? 'Cancel' : 'Add Task'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 w-[200px] h-10 justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400 hover:scale-[1.02]"
                title={showCompleted ? "Hide completed tasks" : "Show completed tasks"}
              >
                <div className="flex items-center gap-2">
                  {showCompleted ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  {showCompleted ? 'Hide Completed' : 'Show Completed'}
                </div>
              </Button>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[200px] shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400">
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
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 w-[200px] h-10 justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {showAddTask && (
              <div className="rounded-lg border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400 hover:scale-[1.01] hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <div className="p-4">
                  <div className="flex flex-col gap-4">
                    <Input
                      placeholder="Task name"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="h-12 text-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                    />
                    <div className="flex gap-4">
                      <select
                        value={newTaskCompany}
                        onChange={(e) => setNewTaskCompany(e.target.value)}
                        className="flex h-12 w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                      >
                        <option value="">Select company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="h-12 w-[200px] shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
                      />
                      <Button 
                        onClick={() => {
                          handleAddTask();
                          setShowAddTask(false);
                        }}
                        className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background h-12 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                        type="button"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
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
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleSubtaskDragEnd(task.id, event)}
                        >
                          <SortableContext
                            items={task.subtasks.map(subtask => subtask.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {task.subtasks.map(subtask => renderTask(subtask, true))}
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                    {!task.parentTaskId && addingSubtask === task.id && (
                      <div className="ml-8 flex items-center gap-2">
                        <Input
                          type="text"
                          value={newSubtaskName}
                          onChange={(e) => setNewSubtaskName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSubtask(task.id);
                            }
                          }}
                          placeholder="Enter subtask name"
                          className="flex-1"
                          autoFocus
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddSubtask(task.id)}
                                className="hover:bg-green-50 transition-all duration-300 hover:scale-110"
                              >
                                <Plus className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add subtask</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setAddingSubtask(null);
                                  setNewSubtaskName('');
                                }}
                                className="hover:bg-gray-100 transition-all duration-300 hover:scale-110"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancel</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                ))}
              </SortableContext>
            </DndContext>
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
            {!editingTask?.parentTaskId && (
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
            )}
            <Input
              type="date"
              value={editingTask?.createdAt ? format(new Date(editingTask.createdAt), 'yyyy-MM-dd') : ''}
              onChange={(e) => setEditingTask(prev => prev ? { 
                ...prev, 
                createdAt: new Date(e.target.value)
              } : null)}
              className="h-10 shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-400"
            />
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
              className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 hover:scale-[1.02]"
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