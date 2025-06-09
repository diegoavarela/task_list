import puppeteer, { Browser, Page } from 'puppeteer';

describe('Complete Application Workflow E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    // Navigate to the application
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
  });

  describe('Complete Task Management Workflow', () => {
    test('should complete full task lifecycle', async () => {
      // 1. Add a new task
      await page.click('[data-testid="add-task-button"]');
      await page.waitForSelector('[data-testid="task-input"]');
      
      await page.type('[data-testid="task-input"]', 'E2E Test Task');
      await page.type('[data-testid="task-description"]', 'This is an end-to-end test task');
      
      // Set priority
      await page.click('[data-testid="priority-select"]');
      await page.click('[data-value="high"]');
      
      // Set due date
      await page.click('[data-testid="due-date-input"]');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.type('[data-testid="due-date-input"]', tomorrow.toISOString().split('T')[0]);
      
      // Add tags
      await page.click('[data-testid="tags-input"]');
      await page.type('[data-testid="tags-input"]', 'urgent');
      await page.keyboard.press('Enter');
      
      // Save task
      await page.click('[data-testid="save-task-button"]');
      
      // Verify task was created
      await page.waitForSelector('[data-testid="task-item"]');
      const taskText = await page.$eval('[data-testid="task-title"]', el => el.textContent);
      expect(taskText).toBe('E2E Test Task');
      
      // 2. Edit the task
      await page.click('[data-testid="task-item"]');
      await page.waitForSelector('[data-testid="edit-task-dialog"]');
      
      await page.clear('[data-testid="task-input"]');
      await page.type('[data-testid="task-input"]', 'Updated E2E Test Task');
      
      // Add subtask
      await page.click('[data-testid="add-subtask-button"]');
      await page.type('[data-testid="subtask-input"]', 'E2E Subtask');
      await page.click('[data-testid="save-subtask-button"]');
      
      // Save changes
      await page.click('[data-testid="save-task-button"]');
      
      // Verify changes
      await page.waitForSelector('[data-testid="task-item"]');
      const updatedTaskText = await page.$eval('[data-testid="task-title"]', el => el.textContent);
      expect(updatedTaskText).toBe('Updated E2E Test Task');
      
      // 3. Mark task as completed
      await page.click('[data-testid="task-checkbox"]');
      
      // Verify completion
      const isCompleted = await page.$eval('[data-testid="task-checkbox"]', el => el.checked);
      expect(isCompleted).toBe(true);
      
      // 4. Test task filtering
      await page.click('[data-testid="filter-completed"]');
      const completedTasks = await page.$$('[data-testid="task-item"]');
      expect(completedTasks.length).toBeGreaterThan(0);
      
      // 5. Test search functionality
      await page.click('[data-testid="search-input"]');
      await page.type('[data-testid="search-input"]', 'Updated E2E');
      
      const searchResults = await page.$$('[data-testid="task-item"]');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('should handle bulk operations', async () => {
      // Create multiple tasks
      for (let i = 1; i <= 3; i++) {
        await page.click('[data-testid="add-task-button"]');
        await page.type('[data-testid="task-input"]', `Bulk Task ${i}`);
        await page.click('[data-testid="save-task-button"]');
        await page.waitFor(500); // Brief pause between creations
      }
      
      // Select multiple tasks
      const checkboxes = await page.$$('[data-testid="task-checkbox"]');
      for (const checkbox of checkboxes) {
        await checkbox.click();
      }
      
      // Perform bulk operation
      await page.click('[data-testid="bulk-actions-button"]');
      await page.click('[data-testid="bulk-complete"]');
      
      // Verify all tasks are completed
      const completedCount = await page.$$eval('[data-testid="task-checkbox"]:checked', elements => elements.length);
      expect(completedCount).toBe(3);
    });
  });

  describe('Company Management Workflow', () => {
    test('should manage companies', async () => {
      // Navigate to companies page
      await page.click('[data-testid="companies-tab"]');
      await page.waitForSelector('[data-testid="companies-page"]');
      
      // Add new company
      await page.click('[data-testid="add-company-button"]');
      await page.type('[data-testid="company-name"]', 'E2E Test Company');
      
      // Select color
      await page.click('[data-testid="color-picker"]');
      await page.click('[data-color="#3b82f6"]');
      
      // Save company
      await page.click('[data-testid="save-company-button"]');
      
      // Verify company was created
      await page.waitForSelector('[data-testid="company-item"]');
      const companyName = await page.$eval('[data-testid="company-name"]', el => el.textContent);
      expect(companyName).toBe('E2E Test Company');
      
      // Edit company
      await page.click('[data-testid="edit-company-button"]');
      await page.clear('[data-testid="company-name"]');
      await page.type('[data-testid="company-name"]', 'Updated E2E Company');
      await page.click('[data-testid="save-company-button"]');
      
      // Verify update
      const updatedName = await page.$eval('[data-testid="company-name"]', el => el.textContent);
      expect(updatedName).toBe('Updated E2E Company');
    });
  });

  describe('Calendar Integration Workflow', () => {
    test('should display tasks in calendar view', async () => {
      // First create a task with due date
      await page.click('[data-testid="add-task-button"]');
      await page.type('[data-testid="task-input"]', 'Calendar Task');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.type('[data-testid="due-date-input"]', tomorrow.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-task-button"]');
      
      // Navigate to calendar
      await page.click('[data-testid="calendar-tab"]');
      await page.waitForSelector('[data-testid="calendar-view"]');
      
      // Verify task appears in calendar
      const calendarTask = await page.$('[data-testid="calendar-task"]');
      expect(calendarTask).toBeTruthy();
      
      // Test calendar navigation
      await page.click('[data-testid="calendar-next"]');
      await page.click('[data-testid="calendar-today"]');
      
      // Test view switching
      await page.click('[data-testid="calendar-week-view"]');
      await page.click('[data-testid="calendar-month-view"]');
    });
  });

  describe('Collaboration Features Workflow', () => {
    test('should handle task assignment and comments', async () => {
      // Create a task
      await page.click('[data-testid="add-task-button"]');
      await page.type('[data-testid="task-input"]', 'Collaboration Task');
      await page.click('[data-testid="save-task-button"]');
      
      // Open task details
      await page.click('[data-testid="task-item"]');
      await page.waitForSelector('[data-testid="task-details-dialog"]');
      
      // Add comment
      await page.click('[data-testid="comments-tab"]');
      await page.type('[data-testid="comment-input"]', 'This is a test comment');
      await page.click('[data-testid="add-comment-button"]');
      
      // Verify comment was added
      await page.waitForSelector('[data-testid="comment-item"]');
      const commentText = await page.$eval('[data-testid="comment-text"]', el => el.textContent);
      expect(commentText).toBe('This is a test comment');
      
      // Test task assignment
      await page.click('[data-testid="assignment-tab"]');
      await page.click('[data-testid="assign-user-select"]');
      await page.click('[data-value="test-user"]');
      
      // Verify assignment
      const assignedUser = await page.$eval('[data-testid="assigned-user"]', el => el.textContent);
      expect(assignedUser).toContain('test-user');
    });
  });

  describe('Billing and Subscription Workflow', () => {
    test('should handle subscription management', async () => {
      // Navigate to billing page
      await page.click('[data-testid="billing-tab"]');
      await page.waitForSelector('[data-testid="billing-page"]');
      
      // Test plan selection
      await page.click('[data-testid="change-plan-button"]');
      await page.waitForSelector('[data-testid="plan-selection-dialog"]');
      
      // Select pro plan
      await page.click('[data-testid="pro-plan-button"]');
      
      // Test billing interval toggle
      await page.click('[data-testid="yearly-toggle"]');
      
      // Verify yearly pricing is shown
      const yearlyPrice = await page.$('[data-testid="yearly-price"]');
      expect(yearlyPrice).toBeTruthy();
      
      // Test payment method
      await page.click('[data-testid="payment-methods-tab"]');
      await page.click('[data-testid="add-payment-method"]');
      
      // Mock card input (in real app this would be Stripe elements)
      await page.type('[data-testid="card-number"]', '4242424242424242');
      await page.type('[data-testid="card-expiry"]', '12/25');
      await page.type('[data-testid="card-cvc"]', '123');
      
      await page.click('[data-testid="save-payment-method"]');
    });
  });

  describe('Notifications Workflow', () => {
    test('should handle notifications', async () => {
      // Create task with due date to trigger notification
      await page.click('[data-testid="add-task-button"]');
      await page.type('[data-testid="task-input"]', 'Urgent Task');
      
      const today = new Date();
      await page.type('[data-testid="due-date-input"]', today.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-task-button"]');
      
      // Open notification center
      await page.click('[data-testid="notifications-button"]');
      await page.waitForSelector('[data-testid="notifications-panel"]');
      
      // Verify notification exists
      const notification = await page.$('[data-testid="notification-item"]');
      expect(notification).toBeTruthy();
      
      // Mark notification as read
      await page.click('[data-testid="mark-read-button"]');
      
      // Test notification settings
      await page.click('[data-testid="notification-settings"]');
      await page.waitForSelector('[data-testid="notification-settings-dialog"]');
      
      // Toggle notification preferences
      await page.click('[data-testid="email-notifications-toggle"]');
      await page.click('[data-testid="push-notifications-toggle"]');
      
      await page.click('[data-testid="save-settings-button"]');
    });
  });

  describe('Data Export and Analytics Workflow', () => {
    test('should export data and show analytics', async () => {
      // Create some sample data
      await page.click('[data-testid="add-task-button"]');
      await page.type('[data-testid="task-input"]', 'Analytics Task 1');
      await page.click('[data-testid="save-task-button"]');
      
      await page.click('[data-testid="add-task-button"]');
      await page.type('[data-testid="task-input"]', 'Analytics Task 2');
      await page.click('[data-testid="save-task-button"]');
      
      // Complete one task
      await page.click('[data-testid="task-checkbox"]');
      
      // Navigate to analytics
      await page.click('[data-testid="analytics-tab"]');
      await page.waitForSelector('[data-testid="analytics-page"]');
      
      // Verify analytics are displayed
      const completionRate = await page.$('[data-testid="completion-rate"]');
      expect(completionRate).toBeTruthy();
      
      // Test data export
      await page.click('[data-testid="export-button"]');
      await page.waitForSelector('[data-testid="export-dialog"]');
      
      // Export as CSV
      await page.click('[data-testid="export-csv"]');
      
      // Export as PDF
      await page.click('[data-testid="export-pdf"]');
      
      // Verify downloads (would need special setup for actual file verification)
    });
  });

  describe('Responsive Design Tests', () => {
    test('should work on mobile viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-menu-button"]');
      await page.waitForSelector('[data-testid="mobile-menu"]');
      
      // Test mobile task creation
      await page.click('[data-testid="mobile-add-task"]');
      await page.type('[data-testid="task-input"]', 'Mobile Task');
      await page.click('[data-testid="save-task-button"]');
      
      // Verify task was created
      const mobileTask = await page.$('[data-testid="task-item"]');
      expect(mobileTask).toBeTruthy();
    });

    test('should work on tablet viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      
      // Test tablet layout
      const sidebar = await page.$('[data-testid="sidebar"]');
      expect(sidebar).toBeTruthy();
      
      // Test task management on tablet
      await page.click('[data-testid="add-task-button"]');
      await page.type('[data-testid="task-input"]', 'Tablet Task');
      await page.click('[data-testid="save-task-button"]');
      
      const tabletTask = await page.$('[data-testid="task-item"]');
      expect(tabletTask).toBeTruthy();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', async () => {
      // Create many tasks programmatically
      await page.evaluate(() => {
        const tasks = [];
        for (let i = 1; i <= 100; i++) {
          tasks.push({
            id: `perf-task-${i}`,
            name: `Performance Task ${i}`,
            completed: false,
            createdAt: new Date(),
            priority: 'medium',
            status: 'todo'
          });
        }
        localStorage.setItem('tasks', JSON.stringify(tasks));
      });
      
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Measure rendering performance
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="task-item"]');
      const endTime = Date.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(2000); // Should render in less than 2 seconds
      
      // Test scrolling performance
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Test search performance with large dataset
      await page.type('[data-testid="search-input"]', 'Performance Task 50');
      await page.waitFor(500);
      
      const searchResults = await page.$$('[data-testid="task-item"]');
      expect(searchResults.length).toBe(1);
    });
  });

  describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async () => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy();
      
      // Test enter key to activate buttons
      await page.focus('[data-testid="add-task-button"]');
      await page.keyboard.press('Enter');
      
      await page.waitForSelector('[data-testid="task-input"]');
      
      // Test escape key to close dialogs
      await page.keyboard.press('Escape');
      
      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
    });

    test('should have proper ARIA attributes', async () => {
      // Check for ARIA labels
      const buttons = await page.$$eval('[role="button"]', elements => 
        elements.map(el => el.getAttribute('aria-label')).filter(Boolean)
      );
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check for proper headings structure
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => el.tagName)
      );
      expect(headings).toContain('H1');
      
      // Check for skip links
      const skipLink = await page.$('[href="#main-content"]');
      expect(skipLink).toBeTruthy();
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle network errors gracefully', async () => {
      // Simulate offline mode
      await page.setOfflineMode(true);
      
      // Try to perform actions that would require network
      await page.click('[data-testid="sync-button"]');
      
      // Should show error message
      const errorMessage = await page.$('[data-testid="offline-error"]');
      expect(errorMessage).toBeTruthy();
      
      // Restore online mode
      await page.setOfflineMode(false);
    });

    test('should handle invalid data gracefully', async () => {
      // Inject invalid data into localStorage
      await page.evaluate(() => {
        localStorage.setItem('tasks', 'invalid-json');
      });
      
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Should show empty state, not crash
      const emptyState = await page.$('[data-testid="empty-state"]');
      expect(emptyState).toBeTruthy();
    });
  });
});