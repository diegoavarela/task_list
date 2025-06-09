import type { Task } from '@/types/task';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  taskId?: string;
  calendarId: string;
  calendarName: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'apple' | 'outlook' | 'local';
  connected: boolean;
  email?: string;
  lastSync?: Date;
  syncEnabled: boolean;
  calendars: Calendar[];
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  providerId: string;
  enabled: boolean;
  readOnly: boolean;
}

export interface CalendarSettings {
  defaultCalendarId?: string;
  syncTasks: boolean;
  syncDueDates: boolean;
  syncReminders: boolean;
  autoCreateEvents: boolean;
  defaultEventDuration: number; // in minutes
  reminderMinutes: number[];
}

export class CalendarService {
  private static readonly STORAGE_KEY = 'calendar_data';
  private static readonly SETTINGS_KEY = 'calendar_settings';
  
  static getProviders(): CalendarProvider[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      return this.getDefaultProviders();
    }
    
    try {
      const parsed = JSON.parse(data);
      return parsed.providers || this.getDefaultProviders();
    } catch {
      return this.getDefaultProviders();
    }
  }

  private static getDefaultProviders(): CalendarProvider[] {
    return [
      {
        id: 'google',
        name: 'Google Calendar',
        type: 'google',
        connected: false,
        syncEnabled: true,
        calendars: []
      },
      {
        id: 'apple',
        name: 'Apple Calendar',
        type: 'apple',
        connected: false,
        syncEnabled: true,
        calendars: []
      },
      {
        id: 'outlook',
        name: 'Microsoft Outlook',
        type: 'outlook',
        connected: false,
        syncEnabled: true,
        calendars: []
      },
      {
        id: 'local',
        name: 'Local Calendar',
        type: 'local',
        connected: true,
        syncEnabled: true,
        calendars: [
          {
            id: 'local-tasks',
            name: 'Tasks',
            color: '#3b82f6',
            providerId: 'local',
            enabled: true,
            readOnly: false
          }
        ]
      }
    ];
  }

  static getSettings(): CalendarSettings {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    if (!data) {
      return this.getDefaultSettings();
    }
    
    try {
      return JSON.parse(data);
    } catch {
      return this.getDefaultSettings();
    }
  }

  private static getDefaultSettings(): CalendarSettings {
    return {
      syncTasks: true,
      syncDueDates: true,
      syncReminders: true,
      autoCreateEvents: false,
      defaultEventDuration: 60,
      reminderMinutes: [15, 30, 60]
    };
  }

  static updateSettings(settings: Partial<CalendarSettings>): CalendarSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  static async connectProvider(providerId: string): Promise<boolean> {
    const providers = this.getProviders();
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider) {
      throw new Error('Provider not found');
    }

    try {
      // In a real implementation, this would handle OAuth flow
      switch (provider.type) {
        case 'google':
          return await this.connectGoogleCalendar(provider);
        case 'apple':
          return await this.connectAppleCalendar(provider);
        case 'outlook':
          return await this.connectOutlookCalendar(provider);
        default:
          return false;
      }
    } catch (error) {
      console.error('Calendar connection failed:', error);
      return false;
    }
  }

  private static async connectGoogleCalendar(provider: CalendarProvider): Promise<boolean> {
    // Mock Google Calendar connection
    // In real implementation, would use Google Calendar API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockCalendars: Calendar[] = [
      {
        id: 'google-primary',
        name: 'Primary',
        color: '#3b82f6',
        providerId: provider.id,
        enabled: true,
        readOnly: false
      },
      {
        id: 'google-work',
        name: 'Work',
        color: '#ef4444',
        providerId: provider.id,
        enabled: true,
        readOnly: false
      }
    ];

    provider.connected = true;
    provider.email = 'user@gmail.com';
    provider.lastSync = new Date();
    provider.calendars = mockCalendars;

    this.saveProviders();
    return true;
  }

  private static async connectAppleCalendar(provider: CalendarProvider): Promise<boolean> {
    // Mock Apple Calendar connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockCalendars: Calendar[] = [
      {
        id: 'apple-home',
        name: 'Home',
        color: '#10b981',
        providerId: provider.id,
        enabled: true,
        readOnly: false
      },
      {
        id: 'apple-work',
        name: 'Work',
        color: '#f59e0b',
        providerId: provider.id,
        enabled: true,
        readOnly: false
      }
    ];

    provider.connected = true;
    provider.email = 'user@icloud.com';
    provider.lastSync = new Date();
    provider.calendars = mockCalendars;

    this.saveProviders();
    return true;
  }

  private static async connectOutlookCalendar(provider: CalendarProvider): Promise<boolean> {
    // Mock Outlook Calendar connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockCalendars: Calendar[] = [
      {
        id: 'outlook-calendar',
        name: 'Calendar',
        color: '#8b5cf6',
        providerId: provider.id,
        enabled: true,
        readOnly: false
      }
    ];

    provider.connected = true;
    provider.email = 'user@outlook.com';
    provider.lastSync = new Date();
    provider.calendars = mockCalendars;

    this.saveProviders();
    return true;
  }

  static disconnectProvider(providerId: string): boolean {
    const providers = this.getProviders();
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider) {
      return false;
    }

    provider.connected = false;
    provider.email = undefined;
    provider.lastSync = undefined;
    provider.calendars = [];

    this.saveProviders();
    return true;
  }

  static async syncTasks(tasks: Task[]): Promise<CalendarEvent[]> {
    const settings = this.getSettings();
    const providers = this.getProviders().filter(p => p.connected && p.syncEnabled);
    
    if (!settings.syncTasks || providers.length === 0) {
      return [];
    }

    const events: CalendarEvent[] = [];

    for (const task of tasks) {
      if (task.dueDate && !task.completed) {
        const event = this.createEventFromTask(task);
        if (event) {
          events.push(event);
        }
      }
    }

    // In real implementation, would sync with actual calendar providers
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return events;
  }

  private static createEventFromTask(task: Task): CalendarEvent | null {
    if (!task.dueDate) return null;

    const settings = this.getSettings();
    const providers = this.getProviders().filter(p => p.connected);
    const defaultProvider = providers[0];
    
    if (!defaultProvider || defaultProvider.calendars.length === 0) return null;

    const calendar = defaultProvider.calendars[0];
    const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
    
    let startTime = dueDate;
    let endTime = new Date(dueDate.getTime() + settings.defaultEventDuration * 60 * 1000);
    let isAllDay = !task.dueTime;

    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      startTime = new Date(dueDate);
      startTime.setHours(hours, minutes, 0, 0);
      endTime = new Date(startTime.getTime() + settings.defaultEventDuration * 60 * 1000);
      isAllDay = false;
    }

    return {
      id: `task-${task.id}`,
      title: task.name,
      description: task.notes,
      start: startTime,
      end: endTime,
      isAllDay,
      taskId: task.id,
      calendarId: calendar.id,
      calendarName: calendar.name
    };
  }

  static async createTaskEvent(task: Task, calendarId?: string): Promise<CalendarEvent | null> {
    const settings = this.getSettings();
    const providers = this.getProviders();
    
    let targetCalendar: Calendar | undefined;
    
    if (calendarId) {
      for (const provider of providers) {
        targetCalendar = provider.calendars.find(c => c.id === calendarId);
        if (targetCalendar) break;
      }
    } else if (settings.defaultCalendarId) {
      for (const provider of providers) {
        targetCalendar = provider.calendars.find(c => c.id === settings.defaultCalendarId);
        if (targetCalendar) break;
      }
    } else {
      // Use first available calendar
      const connectedProvider = providers.find(p => p.connected && p.calendars.length > 0);
      targetCalendar = connectedProvider?.calendars[0];
    }

    if (!targetCalendar || targetCalendar.readOnly) {
      return null;
    }

    const event = this.createEventFromTask(task);
    if (!event) return null;

    event.calendarId = targetCalendar.id;
    event.calendarName = targetCalendar.name;

    // In real implementation, would create actual calendar event
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return event;
  }

  static getCalendars(): Calendar[] {
    const providers = this.getProviders();
    return providers.flatMap(p => p.calendars);
  }

  static getConnectedCalendars(): Calendar[] {
    const providers = this.getProviders().filter(p => p.connected);
    return providers.flatMap(p => p.calendars.filter(c => c.enabled));
  }

  static updateCalendar(calendarId: string, updates: Partial<Calendar>): Calendar | null {
    const providers = this.getProviders();
    
    for (const provider of providers) {
      const calendarIndex = provider.calendars.findIndex(c => c.id === calendarId);
      if (calendarIndex !== -1) {
        provider.calendars[calendarIndex] = {
          ...provider.calendars[calendarIndex],
          ...updates
        };
        this.saveProviders();
        return provider.calendars[calendarIndex];
      }
    }
    
    return null;
  }

  private static saveProviders(): void {
    const providers = this.getProviders();
    const data = { providers };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static async refreshProvider(providerId: string): Promise<boolean> {
    const providers = this.getProviders();
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.connected) {
      return false;
    }

    try {
      // In real implementation, would refresh calendars from provider
      await new Promise(resolve => setTimeout(resolve, 1000));
      provider.lastSync = new Date();
      this.saveProviders();
      return true;
    } catch (error) {
      console.error('Calendar refresh failed:', error);
      return false;
    }
  }
}