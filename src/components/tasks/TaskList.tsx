import { useState } from 'react';
import { PlusCircle, Trash2, CheckCircle2, Edit2, Filter, X } from 'lucide-react';
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(true);

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
      setShowAddTask(false);
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

  const handleTaskClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingDescription(task.description || '');
  };

  const handleTaskEdit = (task: Task) => {
    onUpdateTask({
      ...task,
      title: editingTitle.trim(),
      description: editingDescription.trim() || undefined
    });
    setEditingTaskId(null);
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, task: Task) => {
    if (e.key === 'Enter') {
      handleTaskEdit(task);
    } else if (e.key === 'Escape') {
      setEditingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!showCompleted && task.completed) return false;
    if (filterCompany && task.companyId !== filterCompany) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="input min-w-[200px]"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="checkbox"
            />
            Show Completed
          </label>
          {filterCompany && (
            <button
              onClick={() => setFilterCompany('')}
              className="btn btn-ghost btn-sm"
            >
              <X className="h-4 w-4" />
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="card empty-state">
            <h3 className="empty-state-title">No tasks found</h3>
            <p className="empty-state-description">
              {filterCompany ? 'Try changing your filters' : 'Add a task to get started!'}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map(task => (
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
                    {editingTaskId === task.id ? (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Title</label>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => handleEditKeyPress(e, task)}
                            className="input"
                            autoFocus
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">Description</label>
                          <textarea
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            onKeyDown={(e) => handleEditKeyPress(e, task)}
                            className="input min-h-[100px] resize-y"
                            placeholder="Task description (optional)"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="btn btn-ghost btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleTaskEdit(task)}
                            className="btn btn-primary btn-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => handleTaskClick(task)} className="cursor-pointer">
                        <span className="task-text">
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="task-text text-muted-foreground">{task.description}</p>
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
                    )}
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

      {/* Add Task Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAddTask(true)}
          className="btn btn-primary"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Task
        </button>
      </div>

      {/* Add Task Dialog */}
      {showAddTask && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Add New Task</h2>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="btn btn-ghost btn-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-4">
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
          </div>
        </div>
      )}
    </div>
  );
} 