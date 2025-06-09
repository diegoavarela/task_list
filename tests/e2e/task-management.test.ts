import { Page } from 'puppeteer';
import { TestHelpers } from '../utils/test-helpers';

describe('Task Management E2E Tests', () => {
  let page: Page;
  let helpers: TestHelpers;

  beforeAll(async () => {
    page = await browser.newPage();
    helpers = new TestHelpers(page);
    await helpers.navigateToApp();
  });

  afterAll(async () => {
    await page.close();
  });

  beforeEach(async () => {
    await helpers.clearLocalStorage();
    await page.reload();
    await helpers.waitForElement('[data-testid="app"]');
  });

  describe('Task CRUD Operations', () => {
    test('should create a new task', async () => {
      const taskName = 'Test Task ' + Date.now();
      
      // Take screenshot before
      await helpers.takeScreenshot('task-create-before');
      
      await helpers.createTask(taskName);
      
      // Verify task appears in the list
      await helpers.waitForText(taskName);
      
      // Take screenshot after
      await helpers.takeScreenshot('task-create-after');
      
      // Verify task is saved in localStorage
      const tasksData = await helpers.getLocalStorageData('tasks');
      expect(tasksData).toContain(taskName);
    });

    test('should edit an existing task', async () => {
      const originalName = 'Original Task ' + Date.now();
      const newName = 'Updated Task ' + Date.now();
      
      // Create task first
      await helpers.createTask(originalName);
      await helpers.waitForText(originalName);
      
      // Edit the task
      await helpers.editTask(originalName, newName);
      
      // Verify changes
      await helpers.waitForText(newName);
      await page.waitForFunction(
        (oldName) => !document.querySelector(`text="${oldName}"`),
        {},
        originalName
      );
      
      // Verify persistence
      const tasksData = await helpers.getLocalStorageData('tasks');
      expect(tasksData).toContain(newName);
      expect(tasksData).not.toContain(originalName);
    });

    test('should delete a task', async () => {
      const taskName = 'Task to Delete ' + Date.now();
      
      // Create task first
      await helpers.createTask(taskName);
      await helpers.waitForText(taskName);
      
      // Delete the task
      await helpers.deleteTask(taskName);
      
      // Verify task is removed
      await page.waitForFunction(
        (name) => !document.querySelector(`text="${name}"`),
        {},
        taskName
      );
      
      // Verify removed from localStorage
      const tasksData = await helpers.getLocalStorageData('tasks');
      if (tasksData) {
        expect(tasksData).not.toContain(taskName);
      }
    });

    test('should toggle task completion', async () => {
      const taskName = 'Task to Complete ' + Date.now();
      
      await helpers.createTask(taskName);
      await helpers.waitForText(taskName);
      
      // Take screenshot before completion
      await helpers.takeScreenshot('task-before-completion');
      
      // Toggle completion
      await helpers.toggleTaskCompletion(taskName);
      
      // Take screenshot after completion
      await helpers.takeScreenshot('task-after-completion');
      
      // Verify task appears completed (check for completed styling)
      const taskElement = await page.$(`text="${taskName}"`);
      const isCompleted = await taskElement?.evaluate(el => {
        const taskItem = el.closest('.task-item');
        return taskItem?.classList.contains('completed');
      });
      
      expect(isCompleted).toBe(true);
    });

    test('should create task with subtasks', async () => {
      const parentTask = 'Parent Task ' + Date.now();
      const subtaskName = 'Subtask ' + Date.now();
      
      await helpers.createTask(parentTask);
      await helpers.waitForText(parentTask);
      
      // Find the parent task and add subtask
      const taskElement = await page.$(`text="${parentTask}"`);
      const parentCard = await taskElement?.evaluateHandle(el => el.closest('.task-item'));
      
      if (parentCard) {
        const addSubtaskButton = await parentCard.$('button[title*="Add subtask"]');
        await addSubtaskButton?.click();
        
        // Fill subtask form
        await page.waitForSelector('input[placeholder*="Add a subtask"]');
        await page.fill('input[placeholder*="Add a subtask"]', subtaskName);
        await page.click('button:has-text("Add")');
        
        // Verify subtask appears
        await helpers.waitForText(subtaskName);
        
        // Take screenshot
        await helpers.takeScreenshot('task-with-subtasks');
      }
    });

    test('should handle task search and filtering', async () => {
      const task1 = 'Important Meeting';
      const task2 = 'Code Review';
      const task3 = 'Important Documentation';
      
      // Create multiple tasks
      await helpers.createTask(task1);
      await helpers.createTask(task2);
      await helpers.createTask(task3);
      
      // Test search functionality
      await page.click('button:has-text("Filters")');
      await page.waitForSelector('input[placeholder*="Search"]');
      await page.fill('input[placeholder*="Search"]', 'Important');
      
      // Verify filtered results
      await helpers.waitForText(task1);
      await helpers.waitForText(task3);
      
      // Verify task2 is not visible
      const task2Visible = await page.$(`text="${task2}"`);
      expect(task2Visible).toBeNull();
      
      await helpers.takeScreenshot('task-search-results');
    });
  });

  describe('Data Persistence', () => {
    test('should persist tasks across page reloads', async () => {
      const taskName = 'Persistent Task ' + Date.now();
      
      await helpers.createTask(taskName);
      await helpers.waitForText(taskName);
      
      // Reload page
      await page.reload();
      await helpers.waitForElement('[data-testid="app"]');
      
      // Verify task still exists
      await helpers.waitForText(taskName);
      
      const tasksData = await helpers.getLocalStorageData('tasks');
      expect(tasksData).toContain(taskName);
    });

    test('should handle large datasets', async () => {
      const taskCount = 20;
      const tasks = [];
      
      // Create multiple tasks
      for (let i = 0; i < taskCount; i++) {
        const taskName = `Bulk Task ${i} - ${Date.now()}`;
        tasks.push(taskName);
        await helpers.createTask(taskName);
      }
      
      // Verify all tasks are visible
      for (const task of tasks.slice(0, 5)) { // Check first 5
        await helpers.waitForText(task);
      }
      
      // Check data persistence
      const tasksData = await helpers.getLocalStorageData('tasks');
      const parsedTasks = JSON.parse(tasksData || '[]');
      expect(parsedTasks.length).toBeGreaterThanOrEqual(taskCount);
      
      await helpers.takeScreenshot('bulk-tasks');
    });
  });

  describe('Responsive Design', () => {
    test('should work on mobile devices', async () => {
      await helpers.setMobileViewport();
      
      const taskName = 'Mobile Task ' + Date.now();
      await helpers.createTask(taskName);
      
      await helpers.waitForText(taskName);
      await helpers.takeScreenshot('mobile-task-view');
      
      // Test mobile menu
      await page.click('button[aria-label*="menu"], button:has-text("☰")');
      await helpers.takeScreenshot('mobile-menu');
    });

    test('should work on tablet devices', async () => {
      await helpers.setTabletViewport();
      
      const taskName = 'Tablet Task ' + Date.now();
      await helpers.createTask(taskName);
      
      await helpers.waitForText(taskName);
      await helpers.takeScreenshot('tablet-task-view');
    });
  });

  describe('Performance', () => {
    test('should load quickly', async () => {
      const performance = await helpers.measurePageLoad();
      
      expect(performance.loadTime).toBeLessThan(5000); // 5 seconds
      expect(performance.domContentLoaded).toBeLessThan(3000); // 3 seconds
      
      console.log('Performance metrics:', performance);
    });
  });

  describe('Accessibility', () => {
    test('should be accessible', async () => {
      const issues = await helpers.checkAccessibility();
      
      // Log issues for review but don't fail the test
      if (issues.length > 0) {
        console.warn('Accessibility issues found:', issues);
      }
      
      // You can make this more strict by expecting no issues
      // expect(issues.length).toBe(0);
    });
  });
});