export interface Task {
  id: string;
  name: string;
  companyId: string;
  createdAt: Date;
  completed: boolean;
  subtasks?: Task[];
  parentTaskId?: string;
  order?: number;
} 