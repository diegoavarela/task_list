import type { Task } from '../types/task';
import type { Company } from '../types/company';
import type { Tag } from '../types/tag';

const TASKS_KEY = 'tasks';
const COMPANIES_KEY = 'companies';
const TAGS_KEY = 'tags';

type SerializedTask = Omit<Task, 'createdAt' | 'dueDate' | 'subtasks'> & {
  createdAt: string;
  dueDate?: string;
  subtasks?: SerializedTask[];
};

const serializeTask = (task: Task): SerializedTask => ({
  ...task,
  createdAt: task.createdAt.toISOString(),
  dueDate: task.dueDate?.toISOString(),
  subtasks: task.subtasks?.map(serializeTask)
});

const deserializeTask = (task: SerializedTask): Task => ({
  ...task,
  createdAt: new Date(task.createdAt),
  dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
  subtasks: task.subtasks?.map(deserializeTask) || []
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

type SerializedTag = Omit<Tag, 'createdAt'> & {
  createdAt: string;
};

const serializeTag = (tag: Tag): SerializedTag => ({
  ...tag,
  createdAt: tag.createdAt.toISOString()
});

const deserializeTag = (tag: SerializedTag): Tag => ({
  ...tag,
  createdAt: new Date(tag.createdAt)
});

export const saveTags = (tags: Tag[]): void => {
  try {
    const serializedTags = tags.map(serializeTag);
    localStorage.setItem(TAGS_KEY, JSON.stringify(serializedTags));
    console.log('Tags saved successfully:', tags.length);
  } catch (error) {
    console.error('Error saving tags:', error);
  }
};

export const loadTags = (): Tag[] => {
  try {
    const tags = localStorage.getItem(TAGS_KEY);
    if (!tags) {
      console.log('No tags found in storage');
      return [];
    }
    const parsedTags = JSON.parse(tags) as SerializedTag[];
    const loadedTags = parsedTags.map(deserializeTag);
    console.log('Tags loaded successfully:', loadedTags.length);
    return loadedTags;
  } catch (error) {
    console.error('Error loading tags:', error);
    return [];
  }
}; 