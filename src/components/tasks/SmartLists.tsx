import { useState } from 'react';
import { AlertTriangle, Calendar, Clock, CheckCircle2, Star, Users, Archive, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/task';
import { isToday, isTomorrow, isPast, startOfDay, endOfDay, addDays } from 'date-fns';

interface SmartListsProps {
  tasks: Task[];
  onFilterChange: (filterFn: (task: Task) => boolean, filterName: string) => void;
  activeFilter: string | null;
}

interface SmartList {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  filter: (task: Task) => boolean;
  color: string;
  count?: number;
}

export function SmartLists({ tasks, onFilterChange, activeFilter }: SmartListsProps) {
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = startOfDay(addDays(now, 1));

  const smartLists: SmartList[] = [
    {
      id: 'overdue',
      name: 'Overdue',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Tasks past their due date',
      color: 'text-red-600 bg-red-50 border-red-200',
      filter: (task: Task) => {
        if (!task.dueDate || task.completed) return false;
        const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
        return isPast(startOfDay(dueDate)) && !isToday(dueDate);
      }
    },
    {
      id: 'due-today',
      name: 'Due Today',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Tasks due today',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      filter: (task: Task) => {
        if (!task.dueDate || task.completed) return false;
        const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
        return isToday(dueDate);
      }
    },
    {
      id: 'due-tomorrow',
      name: 'Due Tomorrow',
      icon: <Clock className="h-4 w-4" />,
      description: 'Tasks due tomorrow',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      filter: (task: Task) => {
        if (!task.dueDate || task.completed) return false;
        const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
        return isTomorrow(dueDate);
      }
    },
    {
      id: 'no-due-date',
      name: 'No Due Date',
      icon: <Calendar className="h-4 w-4 opacity-50" />,
      description: 'Tasks without a due date',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      filter: (task: Task) => !task.dueDate && !task.completed
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      icon: <Star className="h-4 w-4" />,
      description: 'High priority tasks',
      color: 'text-red-600 bg-red-50 border-red-200',
      filter: (task: Task) => task.priority === 'high' && !task.completed
    },
    {
      id: 'in-progress',
      name: 'In Progress',
      icon: <Zap className="h-4 w-4" />,
      description: 'Tasks currently being worked on',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      filter: (task: Task) => task.status === 'in_progress'
    },
    {
      id: 'recently-completed',
      name: 'Recently Completed',
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Tasks completed in the last 7 days',
      color: 'text-green-600 bg-green-50 border-green-200',
      filter: (task: Task) => {
        if (!task.completed || !task.completedAt) return false;
        const completedDate = typeof task.completedAt === 'string' ? new Date(task.completedAt) : task.completedAt;
        const sevenDaysAgo = addDays(now, -7);
        return completedDate >= sevenDaysAgo;
      }
    },
    {
      id: 'has-subtasks',
      name: 'Has Subtasks',
      icon: <Users className="h-4 w-4" />,
      description: 'Tasks with subtasks',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      filter: (task: Task) => !task.parentTaskId && task.subtasks && task.subtasks.length > 0
    },
    {
      id: 'blocked',
      name: 'Blocked',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Tasks blocked by dependencies',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      filter: (task: Task) => {
        if (!task.dependencies || task.dependencies.length === 0 || task.completed) return false;
        // Check if any dependencies are incomplete
        return task.dependencies.some(depId => {
          const depTask = tasks.find(t => t.id === depId);
          return depTask && !depTask.completed;
        });
      }
    },
    {
      id: 'archived',
      name: 'Archived',
      icon: <Archive className="h-4 w-4" />,
      description: 'Archived tasks',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      filter: (task: Task) => task.isArchived === true
    }
  ];

  // Calculate counts for each smart list
  const listsWithCounts = smartLists.map(list => ({
    ...list,
    count: tasks.filter(list.filter).length
  }));

  const handleFilterClick = (list: SmartList) => {
    if (activeFilter === list.id) {
      // If clicking the same filter, clear it
      onFilterChange(() => true, '');
    } else {
      // Apply the new filter
      onFilterChange(list.filter, list.id);
    }
  };

  const clearAllFilters = () => {
    onFilterChange(() => true, '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Smart Lists</h3>
        {activeFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground"
          >
            Clear Filter
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {listsWithCounts.map((list) => (
          <Card
            key={list.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeFilter === list.id 
                ? `${list.color} shadow-md border-2` 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleFilterClick(list)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    activeFilter === list.id 
                      ? 'bg-white/80' 
                      : 'bg-muted'
                  }`}>
                    {list.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{list.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {list.description}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={list.count > 0 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {list.count}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
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
                {listsWithCounts.find(l => l.id === 'overdue')?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {listsWithCounts.find(l => l.id === 'due-today')?.count || 0}
              </div>
              <div className="text-xs text-muted-foreground">Due Today</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}