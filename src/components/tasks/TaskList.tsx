import { useState } from 'react';
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import type { Task } from '../../types/task';
import type { Company } from '../../types/company';

interface TaskListProps {
  tasks: Task[];
  companies: Company[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({ tasks, companies, onAddTask, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [companyId, setCompanyId] = useState<string>('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask({
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        completed: false,
        createdAt: new Date(),
        companyId: companyId || '',
        deadline: deadline ? new Date(deadline) : undefined,
        subtasks: []
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setDeadline('');
      setCompanyId('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const getCompanyName = (companyId: string) => {
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
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Task title"
              className="input flex-1"
            />
            <button onClick={handleAddTask} className="btn btn-primary">
              <PlusCircle className="h-4 w-4" />
              Add Task
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Task description (optional)"
              className="input min-h-[100px] resize-y"
            />
            <div className="flex gap-4">
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="input min-w-[200px]"
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
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
              />
            </div>
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
                    <span className="task-text">
                      {task.title}
                    </span>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {task.companyId && (
                        <span>Company: {getCompanyName(task.companyId)}</span>
                      )}
                      {task.deadline && (
                        <span>Due: {task.deadline.toLocaleDateString()}</span>
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