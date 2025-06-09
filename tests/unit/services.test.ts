import { PaymentService } from '../../src/services/paymentService';
import { CalendarService } from '../../src/services/calendarService';
import { NotificationService } from '../../src/services/notificationService';
import { UserService } from '../../src/services/userService';
import type { Task } from '../../src/types/task';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Services Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('PaymentService', () => {
    test('should get available plans', () => {
      const plans = PaymentService.getPlans();
      
      expect(plans).toHaveLength(4);
      expect(plans[0].id).toBe('free');
      expect(plans[1].id).toBe('pro');
      expect(plans[2].id).toBe('business');
      expect(plans[3].id).toBe('enterprise');
    });

    test('should format currency correctly', () => {
      const formatted = PaymentService.formatCurrency(12.99, 'USD');
      expect(formatted).toBe('$12.99');
    });

    test('should determine if user can upgrade', () => {
      const canUpgrade = PaymentService.canUpgrade('free', 'pro');
      expect(canUpgrade).toBe(true);
      
      const cannotUpgrade = PaymentService.canUpgrade('pro', 'free');
      expect(cannotUpgrade).toBe(false);
    });

    test('should create subscription to free plan', async () => {
      const subscription = await PaymentService.subscribeToFreePlan('user-123');
      
      expect(subscription.userId).toBe('user-123');
      expect(subscription.planId).toBe('free');
      expect(subscription.status).toBe('active');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should get plan limits', () => {
      const freePlan = PaymentService.getPlanLimits('free');
      expect(freePlan?.maxTasks).toBe(50);
      expect(freePlan?.maxUsers).toBe(1);
      
      const proPlan = PaymentService.getPlanLimits('pro');
      expect(proPlan?.maxTasks).toBe(-1); // unlimited
    });

    test('should create checkout session', async () => {
      const session = await PaymentService.createCheckoutSession('pro', 'user-123');
      
      expect(session.sessionId).toContain('cs_mock_');
      expect(session.url).toContain('checkout.stripe.com');
    });

    test('should add payment method', async () => {
      const paymentMethod = await PaymentService.addPaymentMethod('user-123', {
        type: 'card',
        cardNumber: '4242424242424242',
        expiryMonth: 12,
        expiryYear: 2025,
        cvc: '123'
      });
      
      expect(paymentMethod.last4).toBe('4242');
      expect(paymentMethod.brand).toBe('visa');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('CalendarService', () => {
    test('should get default providers', () => {
      const providers = CalendarService.getProviders();
      
      expect(providers).toHaveLength(4);
      expect(providers.map(p => p.id)).toEqual(['google', 'apple', 'outlook', 'local']);
    });

    test('should get default settings', () => {
      const settings = CalendarService.getSettings();
      
      expect(settings.syncTasks).toBe(true);
      expect(settings.syncDueDates).toBe(true);
      expect(settings.defaultEventDuration).toBe(60);
    });

    test('should update settings', () => {
      const newSettings = CalendarService.updateSettings({
        syncTasks: false,
        defaultEventDuration: 30
      });
      
      expect(newSettings.syncTasks).toBe(false);
      expect(newSettings.defaultEventDuration).toBe(30);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should connect to calendar provider', async () => {
      const success = await CalendarService.connectProvider('google');
      expect(success).toBe(true);
    });

    test('should create task event', async () => {
      const mockTask: Task = {
        id: 'task-1',
        name: 'Test Task',
        companyId: 'company-1',
        completed: false,
        createdAt: new Date(),
        dueDate: new Date(),
        dueTime: '14:30',
        priority: 'medium',
        status: 'todo'
      };

      const event = await CalendarService.createTaskEvent(mockTask);
      expect(event?.title).toBe('Test Task');
      expect(event?.taskId).toBe('task-1');
    });

    test('should sync tasks to calendar', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          companyId: 'company-1',
          completed: false,
          createdAt: new Date(),
          dueDate: new Date(),
          priority: 'high',
          status: 'todo'
        },
        {
          id: 'task-2',
          name: 'Task 2',
          companyId: 'company-1',
          completed: true,
          createdAt: new Date(),
          priority: 'low',
          status: 'completed'
        }
      ];

      const events = await CalendarService.syncTasks(mockTasks);
      // Only incomplete tasks with due dates should create events
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Task 1');
    });
  });

  describe('NotificationService', () => {
    beforeEach(() => {
      // Mock Notification API
      global.Notification = {
        permission: 'granted',
        requestPermission: jest.fn().mockResolvedValue('granted')
      } as any;
    });

    test('should request notification permission', async () => {
      const permission = await NotificationService.requestPermission();
      expect(permission).toBe('granted');
    });

    test('should check for due date notifications', () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Due Today',
          companyId: 'company-1',
          completed: false,
          createdAt: new Date(),
          dueDate: new Date(), // Due today
          priority: 'high',
          status: 'todo'
        },
        {
          id: 'task-2',
          name: 'Due Tomorrow',
          companyId: 'company-1',
          completed: false,
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
          priority: 'medium',
          status: 'todo'
        }
      ];

      // Mock the private method by calling public methods
      NotificationService.startMonitoring(mockTasks);
      
      // Check that monitoring started
      expect(NotificationService['intervalId']).toBeDefined();
      
      NotificationService.stopMonitoring();
    });

    test('should add notification', () => {
      const notification = NotificationService.addNotification({
        title: 'Test Notification',
        message: 'This is a test',
        type: 'info',
        taskId: 'task-1'
      });

      expect(notification.id).toBeDefined();
      expect(notification.title).toBe('Test Notification');
      expect(notification.read).toBe(false);
    });

    test('should mark notification as read', () => {
      const notification = NotificationService.addNotification({
        title: 'Test',
        message: 'Test',
        type: 'info'
      });

      NotificationService.markAsRead(notification.id);
      const notifications = NotificationService.getNotifications();
      const updatedNotification = notifications.find(n => n.id === notification.id);
      
      expect(updatedNotification?.read).toBe(true);
    });

    test('should clear old notifications', () => {
      // Add old notification
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      NotificationService.addNotification({
        title: 'Old Notification',
        message: 'This is old',
        type: 'info'
      });

      // Mock the createdAt to be old
      const notifications = NotificationService.getNotifications();
      if (notifications.length > 0) {
        notifications[0].createdAt = oldDate;
        // Save back to localStorage
        localStorage.setItem('notifications', JSON.stringify(notifications));
      }

      NotificationService.clearOldNotifications();
      
      const remainingNotifications = NotificationService.getNotifications();
      expect(remainingNotifications.length).toBe(0);
    });
  });

  describe('UserService', () => {
    test('should get current user', () => {
      const user = UserService.getCurrentUser();
      
      expect(user.id).toBe('current-user');
      expect(user.name).toBe('Current User');
      expect(user.role).toBe('owner');
    });

    test('should get all users', () => {
      const users = UserService.getUsers();
      
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].id).toBe('current-user');
    });

    test('should create invite', () => {
      const invite = UserService.createInvite(
        'test@example.com',
        'member',
        'current-user'
      );

      expect(invite.email).toBe('test@example.com');
      expect(invite.role).toBe('member');
      expect(invite.status).toBe('pending');
      expect(invite.invitedBy).toBe('current-user');
    });

    test('should assign task to user', () => {
      const assignment = UserService.assignTask(
        'task-1',
        'user-2',
        'current-user',
        'Please handle this task'
      );

      expect(assignment.taskId).toBe('task-1');
      expect(assignment.assignedTo).toBe('user-2');
      expect(assignment.assignedBy).toBe('current-user');
      expect(assignment.notes).toBe('Please handle this task');
      expect(assignment.status).toBe('assigned');
    });

    test('should create share link', () => {
      const shareLink = UserService.createShareLink(
        'task-1',
        'task',
        'view',
        'current-user'
      );

      expect(shareLink.resourceId).toBe('task-1');
      expect(shareLink.resourceType).toBe('task');
      expect(shareLink.shareType).toBe('view');
      expect(shareLink.createdBy).toBe('current-user');
      expect(shareLink.accessCount).toBe(0);
    });

    test('should update user role', () => {
      const updatedUser = UserService.updateUser('user-2', { role: 'admin' });
      
      expect(updatedUser?.role).toBe('admin');
    });

    test('should remove user', () => {
      const success = UserService.removeUser('user-3');
      expect(success).toBe(true);
    });

    test('should revoke invite', () => {
      const invite = UserService.createInvite('test@example.com', 'member', 'current-user');
      const success = UserService.revokeInvite(invite.id);
      
      expect(success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw error
      expect(() => PaymentService.getPlans()).not.toThrow();
      expect(() => CalendarService.getProviders()).not.toThrow();
    });

    test('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      expect(() => PaymentService.getCurrentSubscription('user-1')).not.toThrow();
      expect(() => CalendarService.getProviders()).not.toThrow();
    });
  });
});