export interface Task {
  id: string;
  name: string;
  companyId: string;
  createdAt: Date;
  completed: boolean;
  subtasks?: Task[];
  parentTaskId?: string;
  order?: number;
  tagIds?: string[];
  dueDate?: Date;
  dueTime?: string; // Format: "HH:mm" (24-hour format)
} 