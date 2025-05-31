import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export default function TaskList() {
  const { companyId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review quarterly report', completed: false },
    { id: '2', title: 'Update website content', completed: true },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
    }
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-base-content">Tasks</h1>
          <div className="join">
            <input
              type="text"
              placeholder="New task"
              className="input input-bordered join-item"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <button 
              className="btn btn-primary join-item"
              onClick={handleAddTask}
            >
              <PlusIcon className="h-5 w-5" />
              Add
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                    />
                    <span className={`text-lg ${task.completed ? 'line-through text-base-content/50' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 