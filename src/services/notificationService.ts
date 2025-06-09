import type { Notification, NotificationPreferences } from '@/types/notification';
import type { Task } from '@/types/task';
import { format, differenceInMinutes, isBefore, isAfter } from 'date-fns';

export class NotificationService {
  private static STORAGE_KEY = 'task-notifications';
  private static PREFERENCES_KEY = 'notification-preferences';
  private static CHECK_INTERVAL = 60000; // Check every minute
  private static intervalId: NodeJS.Timeout | null = null;
  private static notificationHandlers: ((notification: Notification) => void)[] = [];

  // Start monitoring for notifications
  static startMonitoring(tasks: Task[]) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Initial check
    this.checkForNotifications(tasks);

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkForNotifications(tasks);
    }, this.CHECK_INTERVAL);
  }

  // Stop monitoring
  static stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Check for notifications that need to be created
  private static checkForNotifications(tasks: Task[]) {
    const now = new Date();
    const preferences = this.getPreferences('current-user');

    tasks.forEach(task => {
      if (task.completed || task.isArchived) return;

      // Check for due date reminders
      if (task.dueDate && preferences.inApp.dueDateReminder) {
        const dueDate = new Date(task.dueDate);
        const minutesUntilDue = differenceInMinutes(dueDate, now);

        // Due date reminder
        if (minutesUntilDue > 0 && minutesUntilDue <= preferences.reminderTiming.dueDateReminder) {
          const existingNotification = this.findExistingNotification(
            'due_date_reminder',
            task.id,
            preferences.reminderTiming.dueDateReminder * 60000 // Don't send again within the reminder window
          );

          if (!existingNotification) {
            this.createNotification({
              type: 'due_date_reminder',
              title: 'Task Due Soon',
              message: `"${task.name}" is due in ${minutesUntilDue} minutes`,
              taskId: task.id,
              userId: 'system',
              recipientId: 'current-user',
              metadata: {
                dueDate: task.dueDate,
                companyId: task.companyId
              }
            });
          }
        }

        // Overdue reminder
        if (isAfter(now, dueDate) && preferences.inApp.taskOverdue) {
          const minutesOverdue = Math.abs(minutesUntilDue);
          
          if (minutesOverdue <= preferences.reminderTiming.overdueReminder) {
            const existingNotification = this.findExistingNotification(
              'task_overdue',
              task.id,
              24 * 60 * 60000 // Don't send again within 24 hours
            );

            if (!existingNotification) {
              this.createNotification({
                type: 'task_overdue',
                title: 'Task Overdue',
                message: `"${task.name}" was due ${minutesOverdue} minutes ago`,
                taskId: task.id,
                userId: 'system',
                recipientId: 'current-user',
                metadata: {
                  dueDate: task.dueDate,
                  companyId: task.companyId
                }
              });
            }
          }
        }
      }
    });
  }

  // Find existing notification to avoid duplicates
  private static findExistingNotification(
    type: Notification['type'],
    taskId?: string,
    timeWindow?: number
  ): Notification | null {
    const notifications = this.getNotifications();
    const now = new Date();

    return notifications.find(n => {
      if (n.type !== type) return false;
      if (taskId && n.taskId !== taskId) return false;
      if (!timeWindow) return true;

      const createdAt = new Date(n.createdAt);
      const timeDiff = now.getTime() - createdAt.getTime();
      return timeDiff < timeWindow;
    }) || null;
  }

  // Create a new notification
  static createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Notification {
    const notification: Notification = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      isRead: false
    };

    const notifications = this.getNotifications();
    notifications.push(notification);
    this.saveNotifications(notifications);

    // Trigger handlers
    this.notificationHandlers.forEach(handler => handler(notification));

    // Request browser notification permission and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'task_overdue'
      });
    }

    return notification;
  }

  // Get all notifications
  static getNotifications(): Notification[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  // Get unread notifications for a user
  static getUnreadNotifications(userId: string): Notification[] {
    return this.getNotifications()
      .filter(n => n.recipientId === userId && !n.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Mark notification as read
  static markAsRead(notificationId: string) {
    const notifications = this.getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      this.saveNotifications(notifications);
    }
  }

  // Mark all notifications as read for a user
  static markAllAsRead(userId: string) {
    const notifications = this.getNotifications();
    let updated = false;

    notifications.forEach(n => {
      if (n.recipientId === userId && !n.isRead) {
        n.isRead = true;
        n.readAt = new Date();
        updated = true;
      }
    });

    if (updated) {
      this.saveNotifications(notifications);
    }
  }

  // Delete a notification
  static deleteNotification(notificationId: string) {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.saveNotifications(filtered);
  }

  // Clear old notifications (older than 30 days)
  static clearOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => 
      new Date(n.createdAt) > thirtyDaysAgo
    );

    if (filtered.length !== notifications.length) {
      this.saveNotifications(filtered);
    }
  }

  // Save notifications to storage
  private static saveNotifications(notifications: Notification[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
  }

  // Get user preferences
  static getPreferences(userId: string): NotificationPreferences {
    const stored = localStorage.getItem(this.PREFERENCES_KEY);
    if (!stored) {
      return this.getDefaultPreferences(userId);
    }

    try {
      const preferences = JSON.parse(stored);
      return preferences[userId] || this.getDefaultPreferences(userId);
    } catch {
      return this.getDefaultPreferences(userId);
    }
  }

  // Get default preferences
  private static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      inApp: {
        taskAssigned: true,
        taskCompleted: true,
        commentAdded: true,
        commentMention: true,
        dueDateReminder: true,
        taskUpdated: false,
        taskOverdue: true
      },
      reminderTiming: {
        dueDateReminder: 15, // 15 minutes before
        overdueReminder: 60  // 1 hour after
      }
    };
  }

  // Save user preferences
  static savePreferences(preferences: NotificationPreferences) {
    const stored = localStorage.getItem(this.PREFERENCES_KEY);
    const allPreferences = stored ? JSON.parse(stored) : {};
    allPreferences[preferences.userId] = preferences;
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(allPreferences));
  }

  // Register a notification handler
  static onNotification(handler: (notification: Notification) => void) {
    this.notificationHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }

  // Request browser notification permission
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Helper to create task-related notifications
  static notifyTaskAssigned(task: Task, assignedBy: string, assignedTo: string) {
    const preferences = this.getPreferences(assignedTo);
    if (!preferences.inApp.taskAssigned) return;

    this.createNotification({
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned "${task.name}"`,
      taskId: task.id,
      userId: assignedBy,
      recipientId: assignedTo,
      metadata: {
        companyId: task.companyId,
        priority: task.priority
      }
    });
  }

  static notifyTaskCompleted(task: Task, completedBy: string, notifyUsers: string[]) {
    notifyUsers.forEach(userId => {
      const preferences = this.getPreferences(userId);
      if (!preferences.inApp.taskCompleted || userId === completedBy) return;

      this.createNotification({
        type: 'task_completed',
        title: 'Task Completed',
        message: `"${task.name}" has been completed`,
        taskId: task.id,
        userId: completedBy,
        recipientId: userId,
        metadata: {
          companyId: task.companyId
        }
      });
    });
  }

  static notifyCommentAdded(task: Task, comment: any, commentBy: string, notifyUsers: string[]) {
    notifyUsers.forEach(userId => {
      const preferences = this.getPreferences(userId);
      if (!preferences.inApp.commentAdded || userId === commentBy) return;

      this.createNotification({
        type: 'comment_added',
        title: 'New Comment',
        message: `New comment on "${task.name}"`,
        taskId: task.id,
        commentId: comment.id,
        userId: commentBy,
        recipientId: userId,
        metadata: {
          preview: comment.content.substring(0, 100)
        }
      });
    });
  }

  static notifyMention(task: Task, comment: any, mentionedBy: string, mentionedUser: string) {
    const preferences = this.getPreferences(mentionedUser);
    if (!preferences.inApp.commentMention || mentionedUser === mentionedBy) return;

    this.createNotification({
      type: 'comment_mention',
      title: 'You were mentioned',
      message: `You were mentioned in a comment on "${task.name}"`,
      taskId: task.id,
      commentId: comment.id,
      userId: mentionedBy,
      recipientId: mentionedUser,
      metadata: {
        preview: comment.content.substring(0, 100)
      }
    });
  }
}