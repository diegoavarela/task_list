export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'comment_mention' | 'due_date_reminder' | 'task_updated' | 'task_overdue';
  title: string;
  message: string;
  taskId?: string;
  commentId?: string;
  userId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  inApp: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    commentAdded: boolean;
    commentMention: boolean;
    dueDateReminder: boolean;
    taskUpdated: boolean;
    taskOverdue: boolean;
  };
  email?: {
    taskAssigned: boolean;
    taskCompleted: boolean;
    commentMention: boolean;
    dueDateReminder: boolean;
    taskOverdue: boolean;
  };
  reminderTiming: {
    dueDateReminder: number; // minutes before due date
    overdueReminder: number; // minutes after due date
  };
}