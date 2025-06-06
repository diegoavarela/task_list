import type { Task } from '../types/task';
import type { Company } from '../types/company';
import type { Tag } from '../types/tag';
import type { Category } from '../types/category';

interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>;
  isStarred: boolean;
  useCount: number;
  createdAt: Date;
  lastUsed?: Date;
}

const TASKS_KEY = 'tasks';
const COMPANIES_KEY = 'companies';
const TAGS_KEY = 'tags';
const TEMPLATES_KEY = 'templates';
const CATEGORIES_KEY = 'categories';

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
  priority: 'medium',
  status: 'todo',
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

type SerializedTemplate = Omit<TaskTemplate, 'createdAt' | 'lastUsed'> & {
  createdAt: string;
  lastUsed?: string;
};

const serializeTemplate = (template: TaskTemplate): SerializedTemplate => ({
  ...template,
  createdAt: template.createdAt.toISOString(),
  lastUsed: template.lastUsed?.toISOString()
});

const deserializeTemplate = (template: SerializedTemplate): TaskTemplate => ({
  ...template,
  createdAt: new Date(template.createdAt),
  lastUsed: template.lastUsed ? new Date(template.lastUsed) : undefined
});

export const saveTemplates = (templates: TaskTemplate[]): void => {
  try {
    const serializedTemplates = templates.map(serializeTemplate);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(serializedTemplates));
    console.log('Templates saved successfully:', templates.length);
  } catch (error) {
    console.error('Error saving templates:', error);
  }
};

export const loadTemplates = (): TaskTemplate[] => {
  try {
    const templates = localStorage.getItem(TEMPLATES_KEY);
    if (!templates) {
      console.log('No templates found in storage');
      return [];
    }
    const parsedTemplates = JSON.parse(templates) as SerializedTemplate[];
    const loadedTemplates = parsedTemplates.map(deserializeTemplate);
    console.log('Templates loaded successfully:', loadedTemplates.length);
    return loadedTemplates;
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
};

type SerializedCategory = Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt?: string;
};

const serializeCategory = (category: Category): SerializedCategory => ({
  ...category,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt?.toISOString()
});

const deserializeCategory = (category: SerializedCategory): Category => ({
  ...category,
  createdAt: new Date(category.createdAt),
  updatedAt: category.updatedAt ? new Date(category.updatedAt) : undefined
});

export const saveCategories = (categories: Category[]): void => {
  try {
    const serializedCategories = categories.map(serializeCategory);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(serializedCategories));
    console.log('Categories saved successfully:', categories.length);
  } catch (error) {
    console.error('Error saving categories:', error);
  }
};

export const loadCategories = (): Category[] => {
  try {
    const categories = localStorage.getItem(CATEGORIES_KEY);
    if (!categories) {
      console.log('No categories found in storage');
      return [];
    }
    const parsedCategories = JSON.parse(categories) as SerializedCategory[];
    const loadedCategories = parsedCategories.map(deserializeCategory);
    console.log('Categories loaded successfully:', loadedCategories.length);
    return loadedCategories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
};

export type { TaskTemplate }; 