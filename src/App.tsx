import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { TaskList } from './components/tasks/TaskList';
import { CompanyConfig } from './components/company/CompanyConfig';

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

type Page = 'tasks' | 'company';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const handleAddTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleAddCompany = (company: Company) => {
    setCompanies([...companies, company]);
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanies(companies.filter(company => company.id !== companyId));
    // Also remove company from tasks
    setTasks(tasks.map(task => ({
      ...task,
      companyId: task.companyId === companyId ? undefined : task.companyId
    })));
  };

  return (
    <div>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
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
      </Layout>
    </div>
  );
}
