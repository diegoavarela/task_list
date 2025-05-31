export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  deadline?: Date;
  companyId: string;
  parentTaskId?: string;
  subtasks: Task[];
} 