import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { Task } from './types/task';
import type { Company } from './types/company';
import { TaskList } from './components/tasks/TaskList';
import { CompanyConfig } from './components/company/CompanyConfig';
import { Layout } from './components/layout/Layout';
import { saveTasks, loadTasks, saveCompanies, loadCompanies } from './lib/storage';
import { Toaster } from "@/components/ui/toaster"

type Page = 'tasks' | 'companies';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedCompanies = loadCompanies();
    setTasks(loadedTasks);
    setCompanies(loadedCompanies);
  }, []);

  const handleSave = () => {
    try {
      saveTasks(tasks);
      saveCompanies(companies);
      setSaveError(null);
    } catch (error) {
      setSaveError('Failed to save changes. Please try again.');
    }
  };

  const handleAddTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleAddCompany = (company: Company) => {
    setCompanies(prev => [...prev, company]);
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies(prev => prev.map(company => 
      company.id === updatedCompany.id ? updatedCompany : company
    ));
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies(prev => prev.filter(company => company.id !== companyId));
  };

  return (
    <>
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        onSave={handleSave}
        saveError={saveError}
        tasks={tasks}
        companies={companies}
      >
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
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}
      </Layout>
      <Toaster />
    </>
  );
}
