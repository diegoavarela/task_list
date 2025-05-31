export interface Task {
  id: string;
  name: string;
  companyId: string;
  createdAt: Date;
  subtasks: Task[];
} 