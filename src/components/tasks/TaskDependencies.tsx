import { useState } from 'react';
import { Plus, X, Link, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import type { Task } from '@/types/task';

interface TaskDependenciesProps {
  currentTask: Task;
  allTasks: Task[];
  dependencies: string[]; // Array of task IDs that this task depends on
  onDependenciesChange: (dependencies: string[]) => void;
  disabled?: boolean;
}

export function TaskDependencies({
  currentTask,
  allTasks,
  dependencies,
  onDependenciesChange,
  disabled = false
}: TaskDependenciesProps) {
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const { toast } = useToast();

  // Filter out tasks that can't be dependencies
  const availableTasks = allTasks.filter(task => 
    task.id !== currentTask.id && // Can't depend on itself
    !dependencies.includes(task.id) && // Not already a dependency
    !wouldCreateCycle(task.id) && // Wouldn't create a circular dependency
    !task.completed // Don't depend on completed tasks
  );

  // Check if adding this dependency would create a circular dependency
  function wouldCreateCycle(taskId: string): boolean {
    // If the potential dependency task depends on the current task (directly or indirectly)
    return checkDependencyChain(taskId, currentTask.id, new Set());
  }

  function checkDependencyChain(startTaskId: string, targetTaskId: string, visited: Set<string>): boolean {
    if (visited.has(startTaskId)) return false; // Avoid infinite loops
    visited.add(startTaskId);

    const startTask = allTasks.find(t => t.id === startTaskId);
    if (!startTask || !startTask.dependencies) return false;

    for (const depId of startTask.dependencies) {
      if (depId === targetTaskId) return true;
      if (checkDependencyChain(depId, targetTaskId, new Set(visited))) return true;
    }

    return false;
  }

  const addDependency = () => {
    if (!selectedDependency) return;

    if (wouldCreateCycle(selectedDependency)) {
      toast({
        title: "Circular dependency detected",
        description: "Adding this dependency would create a circular dependency chain.",
        variant: "destructive"
      });
      return;
    }

    const newDependencies = [...dependencies, selectedDependency];
    onDependenciesChange(newDependencies);
    setSelectedDependency('');
    
    toast({
      title: "Dependency added",
      description: "Task dependency has been added successfully."
    });
  };

  const removeDependency = (taskId: string) => {
    const newDependencies = dependencies.filter(id => id !== taskId);
    onDependenciesChange(newDependencies);
    
    toast({
      title: "Dependency removed",
      description: "Task dependency has been removed."
    });
  };

  const getDependencyTask = (taskId: string) => {
    return allTasks.find(task => task.id === taskId);
  };

  const getBlockingTasks = () => {
    return dependencies
      .map(getDependencyTask)
      .filter(task => task && !task.completed);
  };

  const blockingTasks = getBlockingTasks();
  const isBlocked = blockingTasks.length > 0;

  return (
    <div className="space-y-4">
      {/* Add Dependency */}
      {!disabled && (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={selectedDependency} onValueChange={setSelectedDependency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task this depends on..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No available tasks to depend on
                      </div>
                    ) : (
                      availableTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                task.priority === 'high' ? 'bg-red-500' :
                                task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                            />
                            <span className="truncate">{task.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={addDependency}
                disabled={!selectedDependency}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Link className="h-4 w-4" />
            Dependencies ({dependencies.length})
          </h4>
          <div className="space-y-2">
            {dependencies.map((depId) => {
              const depTask = getDependencyTask(depId);
              if (!depTask) return null;

              return (
                <Card key={depId} className={`p-3 ${depTask.completed ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          depTask.completed ? 'bg-green-500' :
                          depTask.priority === 'high' ? 'bg-red-500' :
                          depTask.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${depTask.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {depTask.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={depTask.completed ? 'secondary' : 'outline'} className="text-xs">
                            {depTask.status}
                          </Badge>
                          {depTask.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(depTask.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDependency(depId)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Blocking Status */}
      {isBlocked && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                This task is blocked by {blockingTasks.length} incomplete {blockingTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Complete the dependency tasks above before starting this task.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Dependencies Message */}
      {dependencies.length === 0 && !disabled && (
        <div className="text-center py-4 text-muted-foreground">
          <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No dependencies set</p>
          <p className="text-xs">Add tasks that must be completed before this one can start</p>
        </div>
      )}
    </div>
  );
}