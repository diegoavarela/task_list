export interface Task {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  notes?: string;
  companyId: string;
  categoryId?: string;
  assignedToId?: string;
  createdById?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  completed: boolean;
  dueDate?: Date;
  dueTime?: string; // Format: "HH:mm" (24-hour format)
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  subtasks?: Task[];
  parentTaskId?: string;
  order?: number;
  tagIds?: string[];
  estimatedHours?: number;
  actualHours?: number;
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  isTemplate?: boolean;
  templateName?: string;
  attachments?: TaskAttachment[];
  dependencies?: string[];
  isArchived?: boolean;
  comments?: TaskComment[];
  timeEntries?: TaskTimeEntry[];
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  mentions: string[];
  attachments: TaskAttachment[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
} 