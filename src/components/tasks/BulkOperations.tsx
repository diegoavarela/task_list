import { useState } from 'react';
import { CheckSquare, Trash2, Archive, Edit, Calendar, Tag as TagIcon, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Task } from '@/types/task';
import type { Company } from '@/types/company';
import type { Tag } from '@/types/tag';

interface BulkOperationsProps {
  selectedTasks: string[];
  tasks: Task[];
  companies: Company[];
  tags: Tag[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onClearSelection: () => void;
}

type BulkOperation = 
  | 'delete'
  | 'mark-complete'
  | 'mark-incomplete'
  | 'archive'
  | 'unarchive'
  | 'change-priority'
  | 'change-status'
  | 'change-company'
  | 'add-tags'
  | 'remove-tags'
  | 'set-due-date';

export function BulkOperations({
  selectedTasks,
  tasks,
  companies,
  tags,
  onTaskUpdate,
  onTaskDelete,
  onClearSelection
}: BulkOperationsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [operationValue, setOperationValue] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  const selectedTaskObjects = tasks.filter(task => selectedTasks.includes(task.id));

  const operations = [
    {
      id: 'mark-complete' as BulkOperation,
      label: 'Mark Complete',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-green-600',
      description: 'Mark selected tasks as completed'
    },
    {
      id: 'mark-incomplete' as BulkOperation,
      label: 'Mark Incomplete',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-gray-600',
      description: 'Mark selected tasks as incomplete'
    },
    {
      id: 'change-priority' as BulkOperation,
      label: 'Change Priority',
      icon: <Edit className="h-4 w-4" />,
      color: 'text-orange-600',
      description: 'Update priority for selected tasks'
    },
    {
      id: 'change-status' as BulkOperation,
      label: 'Change Status',
      icon: <Edit className="h-4 w-4" />,
      color: 'text-blue-600',
      description: 'Update status for selected tasks'
    },
    {
      id: 'change-company' as BulkOperation,
      label: 'Change Company',
      icon: <Building2 className="h-4 w-4" />,
      color: 'text-purple-600',
      description: 'Assign selected tasks to a different company'
    },
    {
      id: 'set-due-date' as BulkOperation,
      label: 'Set Due Date',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-indigo-600',
      description: 'Set due date for selected tasks'
    },
    {
      id: 'add-tags' as BulkOperation,
      label: 'Add Tags',
      icon: <TagIcon className="h-4 w-4" />,
      color: 'text-cyan-600',
      description: 'Add tags to selected tasks'
    },
    {
      id: 'remove-tags' as BulkOperation,
      label: 'Remove Tags',
      icon: <TagIcon className="h-4 w-4" />,
      color: 'text-red-600',
      description: 'Remove tags from selected tasks'
    },
    {
      id: 'archive' as BulkOperation,
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      color: 'text-gray-600',
      description: 'Archive selected tasks'
    },
    {
      id: 'delete' as BulkOperation,
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      color: 'text-red-600',
      description: 'Permanently delete selected tasks'
    }
  ];

  const handleOperationClick = (operation: BulkOperation) => {
    setCurrentOperation(operation);
    setOperationValue('');
    setSelectedTags([]);
    
    // Operations that don't need additional input
    if (['mark-complete', 'mark-incomplete', 'archive', 'unarchive'].includes(operation)) {
      executeOperation(operation);
    } else {
      setShowDialog(true);
    }
  };

  const executeOperation = (operation: BulkOperation, value?: string, tags?: string[]) => {
    let updatesApplied = 0;

    selectedTasks.forEach(taskId => {
      switch (operation) {
        case 'mark-complete':
          onTaskUpdate(taskId, { completed: true, completedAt: new Date(), status: 'completed' });
          updatesApplied++;
          break;
        
        case 'mark-incomplete':
          onTaskUpdate(taskId, { completed: false, completedAt: undefined, status: 'todo' });
          updatesApplied++;
          break;
        
        case 'archive':
          onTaskUpdate(taskId, { isArchived: true });
          updatesApplied++;
          break;
        
        case 'unarchive':
          onTaskUpdate(taskId, { isArchived: false });
          updatesApplied++;
          break;
        
        case 'change-priority':
          if (value) {
            onTaskUpdate(taskId, { priority: value as 'high' | 'medium' | 'low' });
            updatesApplied++;
          }
          break;
        
        case 'change-status':
          if (value) {
            onTaskUpdate(taskId, { status: value as 'todo' | 'in_progress' | 'completed' | 'cancelled' });
            updatesApplied++;
          }
          break;
        
        case 'change-company':
          if (value) {
            onTaskUpdate(taskId, { companyId: value });
            updatesApplied++;
          }
          break;
        
        case 'set-due-date':
          if (value) {
            onTaskUpdate(taskId, { dueDate: new Date(value) });
            updatesApplied++;
          }
          break;
        
        case 'add-tags':
          if (tags && tags.length > 0) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
              const existingTags = task.tagIds || [];
              const newTags = [...new Set([...existingTags, ...tags])];
              onTaskUpdate(taskId, { tagIds: newTags });
              updatesApplied++;
            }
          }
          break;
        
        case 'remove-tags':
          if (tags && tags.length > 0) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
              const existingTags = task.tagIds || [];
              const remainingTags = existingTags.filter(tagId => !tags.includes(tagId));
              onTaskUpdate(taskId, { tagIds: remainingTags });
              updatesApplied++;
            }
          }
          break;
        
        case 'delete':
          onTaskDelete(taskId);
          updatesApplied++;
          break;
      }
    });

    // Show success toast
    toast({
      title: "Bulk operation completed",
      description: `Successfully updated ${updatesApplied} task${updatesApplied !== 1 ? 's' : ''}`
    });

    // Clear selection and close dialog
    onClearSelection();
    setShowDialog(false);
    setCurrentOperation(null);
  };

  const handleDialogConfirm = () => {
    if (currentOperation === 'add-tags' || currentOperation === 'remove-tags') {
      executeOperation(currentOperation, operationValue, selectedTags);
    } else {
      executeOperation(currentOperation!, operationValue);
    }
  };

  if (selectedTasks.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {operations.map((operation) => (
              <Button
                key={operation.id}
                variant="outline"
                size="sm"
                onClick={() => handleOperationClick(operation.id)}
                className={`flex items-center gap-2 ${operation.color} hover:bg-background/80`}
                title={operation.description}
              >
                {operation.icon}
                <span className="hidden sm:inline text-xs">{operation.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operations.find(op => op.id === currentOperation)?.label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {currentOperation === 'change-priority' && (
              <Select value={operationValue} onValueChange={setOperationValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {currentOperation === 'change-status' && (
              <Select value={operationValue} onValueChange={setOperationValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {currentOperation === 'change-company' && (
              <Select value={operationValue} onValueChange={setOperationValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
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
            )}
            
            {currentOperation === 'set-due-date' && (
              <Input
                type="date"
                value={operationValue}
                onChange={(e) => setOperationValue(e.target.value)}
                placeholder="Select due date"
              />
            )}
            
            {(currentOperation === 'add-tags' || currentOperation === 'remove-tags') && (
              <div className="space-y-2">
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
                        {tag.name}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {currentOperation === 'delete' && (
              <div className="text-sm text-destructive">
                Are you sure you want to permanently delete {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDialogConfirm}
              variant={currentOperation === 'delete' ? 'destructive' : 'default'}
              disabled={
                (currentOperation === 'change-priority' || 
                 currentOperation === 'change-status' || 
                 currentOperation === 'change-company' || 
                 currentOperation === 'set-due-date') && !operationValue ||
                ((currentOperation === 'add-tags' || currentOperation === 'remove-tags') && selectedTags.length === 0)
              }
            >
              {currentOperation === 'delete' ? 'Delete' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}