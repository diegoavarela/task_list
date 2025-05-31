import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { Task } from './types/task';
import type { Company } from './types/company';
import { TaskList } from './components/tasks/TaskList';
import { CompanyConfig } from './components/company/CompanyConfig';
import { Layout } from './components/layout/Layout';
import { saveTasks, loadTasks, saveCompanies, loadCompanies } from './lib/storage';

type Page = 'tasks' | 'companies';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const loadedTasks = loadTasks();
      const loadedCompanies = loadCompanies();
      
      // Convert string dates back to Date objects
      setTasks(loadedTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        deadline: task.deadline ? new Date(task.deadline) : undefined,
        subtasks: task.subtasks.map(subtask => ({
          ...subtask,
          createdAt: new Date(subtask.createdAt),
          deadline: subtask.deadline ? new Date(subtask.deadline) : undefined,
          subtasks: []
        }))
      })));
      
      setCompanies(loadedCompanies.map(company => ({
        ...company,
        createdAt: new Date(company.createdAt)
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      setSaveError('Failed to load saved data. Please try refreshing the page.');
    }
  }, []);

  const handleSave = () => {
    try {
      saveTasks(tasks);
      saveCompanies(companies);
      setSaveError(null);
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveError('Failed to save data. Please check your browser settings.');
    }
  };

  const handleAddTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleAddCompany = (company: Company) => {
    setCompanies([...companies, company]);
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies(companies.filter(company => company.id !== companyId));
    // Unassign tasks from deleted company
    setTasks(tasks.map(task => 
      task.companyId === companyId 
        ? { ...task, companyId: '' }
        : task
    ));
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      <div className="space-y-4">
        {saveError && (
          <div className="card bg-destructive/10 text-destructive p-4">
            <p>{saveError}</p>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn btn-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
        {currentPage === 'tasks' ? (
          <TaskList
            tasks={tasks}
            companies={companies}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : (
          <CompanyConfig
            companies={companies}
            onAddCompany={handleAddCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}
      </div>
    </Layout>
  );
}
