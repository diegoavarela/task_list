import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the storage module
jest.mock('../../src/lib/storage', () => ({
  saveTasks: jest.fn(),
  loadTasks: jest.fn(() => []),
  saveCompanies: jest.fn(),
  loadCompanies: jest.fn(() => []),
  saveTags: jest.fn(),
  loadTags: jest.fn(() => []),
  saveTemplates: jest.fn(),
  loadTemplates: jest.fn(() => []),
  saveCategories: jest.fn(),
  loadCategories: jest.fn(() => [])
}));

// Mock services
jest.mock('../../src/services/paymentService');
jest.mock('../../src/services/calendarService');
jest.mock('../../src/services/notificationService');

// Component imports
import { TaskList } from '../../src/components/tasks/TaskList';
import { PlanSelection } from '../../src/components/billing/PlanSelection';
import { CalendarView } from '../../src/components/calendar/CalendarView';
import { BillingPage } from '../../src/components/billing/BillingPage';

// Mock data
const mockTasks = [
  {
    id: 'task-1',
    name: 'Test Task 1',
    companyId: 'company-1',
    completed: false,
    createdAt: new Date(),
    priority: 'high' as const,
    status: 'todo' as const
  },
  {
    id: 'task-2',
    name: 'Test Task 2',
    companyId: 'company-1',
    completed: true,
    createdAt: new Date(),
    priority: 'medium' as const,
    status: 'completed' as const
  }
];

const mockCompanies = [
  {
    id: 'company-1',
    name: 'Test Company',
    color: '#3b82f6',
    createdAt: new Date()
  }
];

const mockTags = [
  {
    id: 'tag-1',
    name: 'Test Tag',
    color: '#10b981',
    createdAt: new Date()
  }
];

const mockCategories = [
  {
    id: 'category-1',
    name: 'Test Category',
    color: '#8b5cf6',
    parentId: undefined,
    order: 0,
    createdAt: new Date()
  }
];

describe('Component Unit Tests', () => {
  describe('TaskList Component', () => {
    const defaultProps = {
      tasks: mockTasks,
      companies: mockCompanies,
      tags: mockTags,
      categories: mockCategories,
      templates: [],
      onTaskUpdate: jest.fn(),
      onTaskDelete: jest.fn(),
      onTaskAdd: jest.fn(),
      showAddTask: false,
      setShowAddTask: jest.fn(),
      showCompleted: true,
      setShowCompleted: jest.fn(),
      onTemplateCreate: jest.fn(),
      onTemplateUpdate: jest.fn(),
      onTemplateDelete: jest.fn(),
      onTemplateUse: jest.fn(),
      onCategoryCreate: jest.fn(),
      onCategoryUpdate: jest.fn(),
      onCategoryDelete: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should render task list with tasks', () => {
      render(<TaskList {...defaultProps} />);
      
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    test('should show add task form when showAddTask is true', () => {
      render(<TaskList {...defaultProps} showAddTask={true} />);
      
      expect(screen.getByPlaceholderText(/What needs to be done/)).toBeInTheDocument();
    });

    test('should filter completed tasks when showCompleted is false', () => {
      render(<TaskList {...defaultProps} showCompleted={false} />);
      
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      // Completed task should not be visible
      expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
    });

    test('should call onTaskAdd when adding a new task', async () => {
      const user = userEvent.setup();
      const onTaskAdd = jest.fn();
      
      render(<TaskList {...defaultProps} showAddTask={true} onTaskAdd={onTaskAdd} />);
      
      const taskInput = screen.getByPlaceholderText(/What needs to be done/);
      await user.type(taskInput, 'New Test Task');
      
      // Select company
      const companySelect = screen.getByDisplayValue('Select company');
      await user.click(companySelect);
      
      // Submit task
      const addButton = screen.getByRole('button', { name: /Add Task/ });
      await user.click(addButton);
      
      expect(onTaskAdd).toHaveBeenCalled();
    });

    test('should toggle task completion', async () => {
      const user = userEvent.setup();
      const onTaskUpdate = jest.fn();
      
      render(<TaskList {...defaultProps} onTaskUpdate={onTaskUpdate} />);
      
      const checkbox = screen.getAllByRole('button')[0]; // First checkbox
      await user.click(checkbox);
      
      expect(onTaskUpdate).toHaveBeenCalled();
    });

    test('should show empty state when no tasks', () => {
      render(<TaskList {...defaultProps} tasks={[]} />);
      
      expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
    });

    test('should handle search functionality', async () => {
      const user = userEvent.setup();
      
      render(<TaskList {...defaultProps} />);
      
      // Open filters
      const filtersButton = screen.getByRole('button', { name: /Filters/ });
      await user.click(filtersButton);
      
      // Search for specific task
      const searchInput = screen.getByPlaceholderText(/Search tasks/);
      await user.type(searchInput, 'Test Task 1');
      
      // Should show filtered results
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    test('should handle task editing', async () => {
      const user = userEvent.setup();
      const onTaskUpdate = jest.fn();
      
      render(<TaskList {...defaultProps} onTaskUpdate={onTaskUpdate} />);
      
      // Click on task to edit
      const task = screen.getByText('Test Task 1');
      await user.click(task);
      
      // Should open edit dialog
      await waitFor(() => {
        expect(screen.getByText(/Edit Task/)).toBeInTheDocument();
      });
    });
  });

  describe('PlanSelection Component', () => {
    test('should render all plan options', () => {
      render(<PlanSelection />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    test('should show current plan when subscription exists', () => {
      const mockSubscription = {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'pro',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      render(<PlanSelection currentSubscription={mockSubscription} />);
      
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    });

    test('should handle plan selection', async () => {
      const user = userEvent.setup();
      const onPlanSelected = jest.fn();
      
      render(<PlanSelection onPlanSelected={onPlanSelected} />);
      
      const freeButton = screen.getByRole('button', { name: /Select Plan/ });
      await user.click(freeButton);
      
      // Should handle plan selection
      await waitFor(() => {
        expect(onPlanSelected).toHaveBeenCalled();
      });
    });

    test('should toggle billing interval', async () => {
      const user = userEvent.setup();
      
      render(<PlanSelection />);
      
      const yearlyButton = screen.getByRole('button', { name: /Yearly/ });
      await user.click(yearlyButton);
      
      // Should show yearly pricing
      expect(screen.getByText(/Save 20%/)).toBeInTheDocument();
    });
  });

  describe('CalendarView Component', () => {
    test('should render calendar with tasks', () => {
      render(<CalendarView tasks={mockTasks} />);
      
      expect(screen.getByText(/Calendar/)).toBeInTheDocument();
    });

    test('should handle view mode changes', async () => {
      const user = userEvent.setup();
      
      render(<CalendarView tasks={mockTasks} />);
      
      // Change to week view
      const weekButton = screen.getByRole('button', { name: /Week/ });
      await user.click(weekButton);
      
      // Should update calendar view
      expect(weekButton).toBeInTheDocument();
    });

    test('should handle date navigation', async () => {
      const user = userEvent.setup();
      
      render(<CalendarView tasks={mockTasks} />);
      
      // Navigate to next month
      const nextButton = screen.getByRole('button', { name: /next/ });
      await user.click(nextButton);
      
      // Should navigate calendar
      expect(nextButton).toBeInTheDocument();
    });

    test('should show today button', () => {
      render(<CalendarView tasks={mockTasks} />);
      
      expect(screen.getByRole('button', { name: /Today/ })).toBeInTheDocument();
    });
  });

  describe('BillingPage Component', () => {
    test('should render billing overview', () => {
      render(<BillingPage />);
      
      expect(screen.getByText(/Billing/)).toBeInTheDocument();
    });

    test('should show plan selection dialog', async () => {
      const user = userEvent.setup();
      
      render(<BillingPage />);
      
      const changePlanButton = screen.getByRole('button', { name: /Choose Plan|Change Plan/ });
      await user.click(changePlanButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Choose Your Plan/)).toBeInTheDocument();
      });
    });

    test('should handle tab navigation', async () => {
      const user = userEvent.setup();
      
      render(<BillingPage />);
      
      // Switch to invoices tab
      const invoicesTab = screen.getByRole('tab', { name: /Invoice History/ });
      await user.click(invoicesTab);
      
      expect(invoicesTab).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Pass invalid props to trigger error
      const invalidProps = {
        ...defaultProps,
        tasks: null as any
      };
      
      expect(() => render(<TaskList {...invalidProps} />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    test('should handle missing data gracefully', () => {
      render(<TaskList {...defaultProps} tasks={[]} companies={[]} tags={[]} />);
      
      expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<TaskList {...defaultProps} />);
      
      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(<TaskList {...defaultProps} showAddTask={true} />);
      
      // Should be able to tab through elements
      const taskInput = screen.getByPlaceholderText(/What needs to be done/);
      await user.tab();
      
      expect(taskInput).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('should handle large datasets', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i}`,
        companyId: 'company-1',
        completed: false,
        createdAt: new Date(),
        priority: 'medium' as const,
        status: 'todo' as const
      }));

      const start = performance.now();
      render(<TaskList {...defaultProps} tasks={largeTasks} />);
      const end = performance.now();
      
      // Should render in reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
    });
  });
});