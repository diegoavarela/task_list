import { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, ChevronDown, ChevronRight, Building2, Calendar } from 'lucide-react';
import type { Task } from '../../types/task';
import type { Company } from '../../types/company';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  companies: Company[];
  onAddTask: (name: string, companyId: string) => void;
  onEditTask: (taskId: string, name: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddCompany: (name: string) => void;
  onEditCompany: (companyId: string, name: string) => void;
  onDeleteCompany: (companyId: string) => void;
}

export function TaskList({
  tasks,
  companies,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
}: TaskListProps) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCompany, setNewTaskCompany] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingTask, setEditingTask] = useState<{ id: string; name: string } | null>(null);
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddTask = () => {
    if (newTaskName.trim() && newTaskCompany) {
      onAddTask(newTaskName.trim(), newTaskCompany);
      setNewTaskName('');
      setNewTaskCompany('');
      toast({
        title: "Task added",
        description: "Your task has been added successfully.",
      });
    }
  };

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      onAddCompany(newCompanyName.trim());
      setNewCompanyName('');
      toast({
        title: "Company added",
        description: "Your company has been added successfully.",
      });
    }
  };

  const handleEditTask = () => {
    if (editingTask && editingTask.name.trim()) {
      onEditTask(editingTask.id, editingTask.name.trim());
      setEditingTask(null);
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    }
  };

  const handleEditCompany = () => {
    if (editingCompany && editingCompany.name.trim()) {
      onEditCompany(editingCompany.id, editingCompany.name.trim());
      setEditingCompany(null);
      toast({
        title: "Company updated",
        description: "Your company has been updated successfully.",
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

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
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
              className="flex-1"
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
            <Button onClick={handleAddTask} className="border-2 border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Company name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddCompany} className="border-2 border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="p-1 hover:bg-accent rounded-md"
                >
                  {expandedTasks.has(task.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getCompanyName(task.companyId)}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{task.name}</span>
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
                  onClick={() => setEditingTask({ id: task.id, name: task.name })}
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
            {expandedTasks.has(task.id) && task.subtasks.length > 0 && (
              <div className="border-t p-4">
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center justify-between pl-8">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getCompanyName(subtask.companyId)}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{subtask.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(subtask.createdAt), 'MMM d, yyyy')}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTask({ id: subtask.id, name: subtask.name })}
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

      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editingTask?.name || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Task name"
            />
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