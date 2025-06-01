import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Building2, Calendar, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import type { Task } from '../../types/task';
import type { Company } from '../../types/company';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TaskListProps {
  tasks: Task[];
  companies: Company[];
  onAddTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({
  tasks,
  companies,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCompany, setNewTaskCompany] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingTask, setEditingTask] = useState<{ 
    id: string; 
    name: string; 
    companyId: string;
    date: string;
    completed: boolean;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(task => task.companyId === selectedCompany);
    }

    // Sort by date
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [tasks, selectedCompany, sortOrder]);

  const handleAddTask = () => {
    console.log('Adding task:', { name: newTaskName, company: newTaskCompany, date: newTaskDate });
    if (newTaskName.trim() && newTaskCompany) {
      const newTask: Task = {
        id: crypto.randomUUID(),
        name: newTaskName.trim(),
        companyId: newTaskCompany,
        createdAt: new Date(newTaskDate),
        completed: false,
        subtasks: []
      };
      onAddTask(newTask);
      setNewTaskName('');
      setNewTaskCompany('');
      setNewTaskDate(format(new Date(), 'yyyy-MM-dd'));
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      });
    } else {
      console.log('Validation failed:', { 
        hasName: !!newTaskName.trim(), 
        hasCompany: !!newTaskCompany 
      });
    }
  };

  const handleEditTask = () => {
    if (editingTask && editingTask.name.trim()) {
      const updatedTask: Task = {
        id: editingTask.id,
        name: editingTask.name.trim(),
        companyId: editingTask.companyId,
        createdAt: new Date(editingTask.date),
        completed: editingTask.completed,
        subtasks: []
      };
      onEditTask(updatedTask);
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
      onDeleteTask(taskToDelete);
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

  const toggleTaskCompletion = (task: Task) => {
    const updatedTask: Task = {
      ...task,
      completed: !task.completed
    };
    onEditTask(updatedTask);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="flex-1 h-10"
            />
            <select
              value={newTaskCompany}
              onChange={(e) => setNewTaskCompany(e.target.value)}
              className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              className="h-10 w-[200px]"
            />
            <Button 
              onClick={handleAddTask} 
              className="border-2 border-black text-black hover:bg-black hover:text-white h-10"
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-[200px]">
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
                size="sm"
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
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedTasks.map((task) => (
              <div key={task.id} className="rounded-lg border bg-card">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className="p-1 hover:bg-accent rounded-md"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div 
                      className="flex flex-col cursor-pointer hover:text-primary"
                      onClick={() => setEditingTask({ 
                        id: task.id, 
                        name: task.name, 
                        companyId: task.companyId,
                        date: format(new Date(task.createdAt), 'yyyy-MM-dd'),
                        completed: task.completed
                      })}
                    >
                      <span className={`text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.name}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{getCompanyName(task.companyId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(task.createdAt), 'MMM d, yyyy')}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTask({ 
                        id: task.id, 
                        name: task.name, 
                        companyId: task.companyId,
                        date: format(new Date(task.createdAt), 'yyyy-MM-dd'),
                        completed: task.completed
                      })}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="border-t p-4">
                    <div className="space-y-2">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center justify-between pl-8">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTaskCompletion(subtask)}
                              className="p-1 hover:bg-accent rounded-md"
                            >
                              {subtask.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <div 
                              className="flex flex-col cursor-pointer hover:text-primary"
                              onClick={() => setEditingTask({ 
                                id: subtask.id, 
                                name: subtask.name, 
                                companyId: subtask.companyId,
                                date: format(new Date(subtask.createdAt), 'yyyy-MM-dd'),
                                completed: subtask.completed
                              })}
                            >
                              <span className={`text-lg ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>{subtask.name}</span>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                <span>{getCompanyName(subtask.companyId)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(subtask.createdAt), 'MMM d, yyyy')}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingTask({ 
                                id: subtask.id, 
                                name: subtask.name, 
                                companyId: subtask.companyId,
                                date: format(new Date(subtask.createdAt), 'yyyy-MM-dd'),
                                completed: subtask.completed
                              })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(subtask.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              value={editingTask?.name || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Task name"
            />
            <select
              value={editingTask?.companyId || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, companyId: e.target.value } : null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              value={editingTask?.date || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, date: e.target.value } : null)}
              className="h-10"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingTask?.completed || false}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, completed: e.target.checked } : null)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label>Mark as completed</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 