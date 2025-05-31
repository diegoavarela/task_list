import type { Task } from '../types/task';
import type { Company } from '../types/company';

const TASKS_KEY = 'tasks';
const COMPANIES_KEY = 'companies';

type SerializedTask = Omit<Task, 'createdAt' | 'deadline' | 'subtasks'> & {
  createdAt: string;
  deadline?: string;
  subtasks: SerializedTask[];
};

const serializeTask = (task: Task): SerializedTask => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  deadline: task.deadline?.toISOString(),
  subtasks: task.subtasks.map(serializeTask)
});

const deserializeTask = (task: SerializedTask): Task => ({
  ...task,
  createdAt: new Date(task.createdAt),
  deadline: task.deadline ? new Date(task.deadline) : undefined,
  subtasks: task.subtasks.map(deserializeTask)
});

export const saveTasks = (tasks: Task[]): void => {
  try {
    const serializedTasks = tasks.map(serializeTask);
    localStorage.setItem(TASKS_KEY, JSON.stringify(serializedTasks));
    console.log('Tasks saved successfully:', tasks.length);
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

export const loadTasks = (): Task[] => {
  try {
    const tasks = localStorage.getItem(TASKS_KEY);
    if (!tasks) {
      console.log('No tasks found in storage');
      return [];
    }
    const parsedTasks = JSON.parse(tasks) as SerializedTask[];
    const loadedTasks = parsedTasks.map(deserializeTask);
    console.log('Tasks loaded successfully:', loadedTasks.length);
    return loadedTasks;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};

type SerializedCompany = Omit<Company, 'createdAt'> & {
  createdAt: string;
};

const serializeCompany = (company: Company): SerializedCompany => ({
  ...company,
  createdAt: company.createdAt.toISOString()
});

const deserializeCompany = (company: SerializedCompany): Company => ({
  ...company,
  createdAt: new Date(company.createdAt)
});

export const saveCompanies = (companies: Company[]): void => {
  try {
    const serializedCompanies = companies.map(serializeCompany);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(serializedCompanies));
    console.log('Companies saved successfully:', companies.length);
  } catch (error) {
    console.error('Error saving companies:', error);
  }
};

export const loadCompanies = (): Company[] => {
  try {
    const companies = localStorage.getItem(COMPANIES_KEY);
    if (!companies) {
      console.log('No companies found in storage');
      return [];
    }
    const parsedCompanies = JSON.parse(companies) as SerializedCompany[];
    const loadedCompanies = parsedCompanies.map(deserializeCompany);
    console.log('Companies loaded successfully:', loadedCompanies.length);
    return loadedCompanies;
  } catch (error) {
    console.error('Error loading companies:', error);
    return [];
  }
}; 