import type { Task } from '@/types/task';
import { addDays, addWeeks, addMonths, addYears, isBefore, startOfDay } from 'date-fns';

interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export class RecurringTaskService {
  /**
   * Generate the next occurrence of a recurring task
   */
  static generateNextOccurrence(baseTask: Task): Task | null {
    if (!baseTask.isRecurring || !baseTask.recurringPattern) {
      return null;
    }

    const pattern = baseTask.recurringPattern;
    const lastDueDate = baseTask.dueDate || new Date();
    const nextDueDate = this.calculateNextDueDate(lastDueDate, pattern);

    if (!nextDueDate) {
      return null;
    }

    // Check if we've reached the end date
    if (pattern.endDate && isBefore(pattern.endDate, nextDueDate)) {
      return null;
    }

    // Create new task instance
    const newTask: Task = {
      ...baseTask,
      id: crypto.randomUUID(),
      dueDate: nextDueDate,
      completed: false,
      completedAt: undefined,
      createdAt: new Date(),
      status: 'todo',
      // Remove parent task reference for recurring instances
      parentTaskId: undefined,
    };

    return newTask;
  }

  /**
   * Generate multiple future occurrences of a recurring task
   */
  static generateFutureOccurrences(baseTask: Task, count: number = 10): Task[] {
    if (!baseTask.isRecurring || !baseTask.recurringPattern) {
      return [];
    }

    const occurrences: Task[] = [];
    let currentTask = baseTask;

    for (let i = 0; i < count; i++) {
      const nextTask = this.generateNextOccurrence(currentTask);
      if (!nextTask) {
        break;
      }
      
      occurrences.push(nextTask);
      currentTask = nextTask;
    }

    return occurrences;
  }

  /**
   * Calculate the next due date based on the recurring pattern
   */
  private static calculateNextDueDate(currentDate: Date, pattern: RecurringPattern): Date | null {
    const current = startOfDay(currentDate);

    switch (pattern.type) {
      case 'daily':
        return addDays(current, pattern.interval);

      case 'weekly':
        if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) {
          return addWeeks(current, pattern.interval);
        }

        // Find the next occurrence on one of the specified days
        let nextDate = addDays(current, 1);
        let weekIncrement = 0;

        while (weekIncrement < pattern.interval || !pattern.daysOfWeek.includes(nextDate.getDay())) {
          if (pattern.daysOfWeek.includes(nextDate.getDay()) && weekIncrement >= pattern.interval) {
            return nextDate;
          }
          
          nextDate = addDays(nextDate, 1);
          
          // If we've completed a week, increment the week counter
          if (nextDate.getDay() === 0) {
            weekIncrement++;
          }
        }

        return nextDate;

      case 'monthly':
        const nextMonth = addMonths(current, pattern.interval);
        
        if (pattern.dayOfMonth) {
          // Set to specific day of month
          const targetDay = Math.min(pattern.dayOfMonth, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
          return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), targetDay);
        } else {
          // Keep the same day of month as the original
          return nextMonth;
        }

      case 'yearly':
        return addYears(current, pattern.interval);

      default:
        return null;
    }
  }

  /**
   * Check if a task should generate its next occurrence
   */
  static shouldGenerateNext(task: Task): boolean {
    if (!task.isRecurring || !task.recurringPattern || !task.completed) {
      return false;
    }

    // Only generate next occurrence when the current one is completed
    return true;
  }

  /**
   * Get a human-readable description of the recurring pattern
   */
  static getPatternDescription(pattern: RecurringPattern): string {
    const interval = pattern.interval === 1 ? '' : `every ${pattern.interval} `;
    
    switch (pattern.type) {
      case 'daily':
        return `Repeats ${interval}day${pattern.interval > 1 ? 's' : ''}`;
      
      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const days = pattern.daysOfWeek.map(day => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return dayNames[day];
          }).join(', ');
          return `Repeats ${interval}week${pattern.interval > 1 ? 's' : ''} on ${days}`;
        }
        return `Repeats ${interval}week${pattern.interval > 1 ? 's' : ''}`;
      
      case 'monthly':
        if (pattern.dayOfMonth) {
          const suffix = pattern.dayOfMonth === 1 ? 'st' : pattern.dayOfMonth === 2 ? 'nd' : pattern.dayOfMonth === 3 ? 'rd' : 'th';
          return `Repeats ${interval}month${pattern.interval > 1 ? 's' : ''} on the ${pattern.dayOfMonth}${suffix}`;
        }
        return `Repeats ${interval}month${pattern.interval > 1 ? 's' : ''}`;
      
      case 'yearly':
        return `Repeats ${interval}year${pattern.interval > 1 ? 's' : ''}`;
      
      default:
        return 'Custom pattern';
    }
  }

  /**
   * Update recurring pattern for a task and regenerate future occurrences
   */
  static updateRecurringPattern(
    task: Task, 
    newPattern: RecurringPattern | null,
    existingTasks: Task[]
  ): { updatedTask: Task; newTasks: Task[]; tasksToRemove: string[] } {
    const updatedTask = {
      ...task,
      isRecurring: !!newPattern,
      recurringPattern: newPattern
    };

    // Remove existing future occurrences of this recurring task
    const tasksToRemove = existingTasks
      .filter(t => 
        t.parentTaskId === task.id || 
        (t.recurringPattern && JSON.stringify(t.recurringPattern) === JSON.stringify(task.recurringPattern) && t.id !== task.id)
      )
      .map(t => t.id);

    // Generate new future occurrences if pattern exists
    const newTasks = newPattern ? this.generateFutureOccurrences(updatedTask, 5) : [];

    return {
      updatedTask,
      newTasks,
      tasksToRemove
    };
  }
}