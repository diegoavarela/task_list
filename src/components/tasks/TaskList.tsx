import { useState } from 'react';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  companyId?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface TaskListProps {
  tasks: Task[];
  companies: Company[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({ tasks, companies, onAddTask, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [companyId, setCompanyId] = useState<string>('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      onAddTask({
        id: Date.now().toString(),
        text: newTask.trim(),
        completed: false,
        companyId: companyId || undefined,
        dueDate: dueDate || undefined,
        priority
      });
      setNewTask('');
      setDueDate('');
      setPriority('medium');
      setCompanyId('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-primary';
      case 'low':
        return 'text-secondary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getCompanyName = (companyId?: string) => {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company?.name;
  };

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Add New Task</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
              className="input flex-1"
            />
            <button onClick={handleAddTask} className="btn btn-primary">
              <PlusCircle className="h-4 w-4" />
              Add Task
            </button>
          </div>
          <div className="flex gap-4">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="input"
            >
              <option value="">Select Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="input"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="card empty-state">
            <h3 className="empty-state-title">No tasks yet</h3>
            <p className="empty-state-description">Add a task above to get started!</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onUpdateTask({ ...task, completed: !task.completed })}
                    className="checkbox"
                  />
                  <div className="flex-1">
                    <span className={`task-text ${getPriorityColor(task.priority || 'medium')}`}>
                      {task.text}
                    </span>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {task.companyId && (
                        <span>Company: {getCompanyName(task.companyId)}</span>
                      )}
                      {task.dueDate && (
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.completed && (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  )}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="btn btn-ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 