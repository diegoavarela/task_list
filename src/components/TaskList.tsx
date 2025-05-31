import { useState, useMemo } from 'react';
import type { Task } from '@/types/task';
import type { Company } from '@/types/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  companies: Company[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type SortOption = 'date' | 'company';
type FilterOption = 'all' | 'active' | 'completed';

export function TaskList({ tasks, companies, onAddTask, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedDeadline, setSelectedDeadline] = useState<string>('');

  const getDeadlineColor = (deadline?: Date) => {
    if (!deadline) return '';
    if (isBefore(deadline, new Date())) return 'text-destructive';
    if (isToday(deadline)) return 'text-amber-500';
    if (isBefore(deadline, addDays(new Date(), 1))) return 'text-yellow-500';
    return '';
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by completion status
    if (filterBy === 'active') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filterBy === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(task => task.companyId === selectedCompany);
    }

    // Sort tasks
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0);
      }
      return a.companyId.localeCompare(b.companyId);
    });
  }, [tasks, selectedCompany, filterBy, sortBy]);

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedCompany || selectedCompany === 'all') return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
      companyId: selectedCompany,
      deadline: selectedDeadline ? new Date(selectedDeadline) : undefined,
      subtasks: [],
    };

    onAddTask(newTask);
    setNewTaskTitle('');
    setSelectedDeadline('');
  };

  const handleAddSubtask = (parentTaskId: string) => {
    if (!newTaskTitle.trim() || !selectedCompany || selectedCompany === 'all') return;

    const newSubtask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date(),
      companyId: selectedCompany,
      parentTaskId,
      deadline: selectedDeadline ? new Date(selectedDeadline) : undefined,
      subtasks: [],
    };

    onAddTask(newSubtask);
    setNewTaskTitle('');
    setSelectedDeadline('');
  };

  const renderTask = (task: Task, level = 0) => (
    <div key={task.id} className="space-y-2">
      <Card className={`${task.completed ? 'opacity-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onUpdateTask({ ...task, completed: !task.completed })}
              className="w-5 h-5 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-lg ${task.completed ? 'line-through' : ''}`}>
                  {task.title}
                </span>
                {task.deadline && (
                  <span className={`text-sm ${getDeadlineColor(task.deadline)}`}>
                    {format(task.deadline, 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {companies.find(c => c.id === task.companyId)?.name}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSubtask(task.id)}
              >
                Add Subtask
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteTask(task.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {task.subtasks.length > 0 && (
        <div className="pl-8 space-y-2">
          {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Task title..."
              className="lg:col-span-2"
            />
            <Input
              type="date"
              value={selectedDeadline}
              onChange={(e) => setSelectedDeadline(e.target.value)}
            />
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAddTask}>Add Task</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex gap-4">
              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedTasks.map(task => renderTask(task))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 