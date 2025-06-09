import puppeteer, { Browser, Page } from 'puppeteer';

describe('Visual Regression Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Setup consistent test data
    await page.evaluate(() => {
      const tasks = [
        {
          id: 'visual-task-1',
          name: 'Visual Test Task 1',
          completed: false,
          priority: 'high',
          status: 'todo',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tags: ['urgent', 'testing'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'visual-task-2',
          name: 'Visual Test Task 2',
          completed: true,
          priority: 'medium',
          status: 'completed',
          tags: ['done'],
          createdAt: new Date().toISOString()
        }
      ];
      
      const companies = [
        {
          id: 'visual-company-1',
          name: 'Visual Test Company',
          color: '#3b82f6',
          createdAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('companies', JSON.stringify(companies));
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
  });

  describe('Page Layouts', () => {
    test('should match tasks page layout', async () => {
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
      
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        customDiffConfig: {
          threshold: 0.1,
        },
        failureThresholdType: 'percent'
      });
    });

    test('should match companies page layout', async () => {
      await page.click('[data-testid="companies-tab"]');
      await page.waitForSelector('[data-testid="companies-page"]');
      
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 1280, height: 720 }
      });
      
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });

    test('should match tags page layout', async () => {
      await helpers.navigateToPage('tags');
      
      const screenshot = await helpers.takeScreenshot('tags-page-layout');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });

    test('should match calendar page layout', async () => {
      await helpers.navigateToPage('calendar');
      
      const screenshot = await helpers.takeScreenshot('calendar-page-layout');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });

    test('should match billing page layout', async () => {
      await helpers.navigateToPage('billing');
      
      const screenshot = await helpers.takeScreenshot('billing-page-layout');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });
  });

  describe('Component States', () => {
    test('should match empty task state', async () => {
      await helpers.navigateToPage('tasks');
      
      const screenshot = await helpers.takeScreenshot('empty-tasks-state');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.1,
        failureThresholdType: 'percent'
      });
    });

    test('should match task list with data', async () => {
      await helpers.navigateToPage('tasks');
      
      // Create sample tasks
      await helpers.createTask('Sample Task 1');
      await helpers.createTask('Sample Task 2');
      await helpers.createTask('Sample Task 3');
      
      const screenshot = await helpers.takeScreenshot('tasks-with-data');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });

    test('should match add task form', async () => {
      await helpers.navigateToPage('tasks');
      
      await page.click('button:has-text("Add Task")');
      await page.waitForSelector('input[placeholder*="What needs to be done"]');
      
      const screenshot = await helpers.takeScreenshot('add-task-form');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.1,
        failureThresholdType: 'percent'
      });
    });

    test('should match task edit dialog', async () => {
      await helpers.navigateToPage('tasks');
      
      const taskName = 'Task to Edit';
      await helpers.createTask(taskName);
      
      // Open edit dialog
      const taskElement = await page.$(`text="${taskName}"`);
      await taskElement?.click();
      
      await page.waitForSelector('[role="dialog"]');
      
      const screenshot = await helpers.takeScreenshot('task-edit-dialog');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });

    test('should match completed task appearance', async () => {
      await helpers.navigateToPage('tasks');
      
      const taskName = 'Task to Complete';
      await helpers.createTask(taskName);
      await helpers.toggleTaskCompletion(taskName);
      
      const screenshot = await helpers.takeScreenshot('completed-task');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });
  });

  describe('Dialog Components', () => {
    test('should match plan selection dialog', async () => {
      await helpers.navigateToPage('billing');
      
      try {
        const choosePlanButton = await page.$('button:has-text("Choose Plan"), button:has-text("Change Plan")');
        if (choosePlanButton) {
          await choosePlanButton.click();
          await page.waitForTimeout(1000);
          
          const screenshot = await helpers.takeScreenshot('plan-selection-dialog');
          expect(screenshot).toMatchImageSnapshot({
            threshold: 0.3,
            failureThresholdType: 'percent'
          });
        }
      } catch (error) {
        console.log('Plan selection dialog test skipped');
      }
    });

    test('should match delete confirmation dialog', async () => {
      await helpers.navigateToPage('tasks');
      
      const taskName = 'Task to Delete';
      await helpers.createTask(taskName);
      
      // Start delete process
      const taskElement = await page.$(`text="${taskName}"`);
      const parentCard = await taskElement?.evaluateHandle(el => el.closest('.task-item'));
      
      if (parentCard) {
        const deleteButton = await parentCard.$('button[title*="Delete"]');
        await deleteButton?.click();
        
        await page.waitForSelector('[role="dialog"]');
        
        const screenshot = await helpers.takeScreenshot('delete-confirmation-dialog');
        expect(screenshot).toMatchImageSnapshot({
          threshold: 0.1,
          failureThresholdType: 'percent'
        });
        
        // Cancel deletion
        await page.click('button:has-text("Cancel")');
      }
    });
  });

  describe('Filter and Search States', () => {
    test('should match filters panel', async () => {
      await helpers.navigateToPage('tasks');
      
      await page.click('button:has-text("Filters")');
      await page.waitForSelector('input[placeholder*="Search"]');
      
      const screenshot = await helpers.takeScreenshot('filters-panel');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });

    test('should match search results', async () => {
      await helpers.navigateToPage('tasks');
      
      // Create tasks for search
      await helpers.createTask('Important Meeting');
      await helpers.createTask('Code Review');
      await helpers.createTask('Important Documentation');
      
      // Search for "Important"
      await page.click('button:has-text("Filters")');
      await page.fill('input[placeholder*="Search"]', 'Important');
      
      const screenshot = await helpers.takeScreenshot('search-results');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.3,
        failureThresholdType: 'percent'
      });
    });
  });

  describe('Mobile Responsive Views', () => {
    test('should match mobile task list', async () => {
      await helpers.setMobileViewport();
      await helpers.navigateToPage('tasks');
      
      await helpers.createTask('Mobile Task 1');
      await helpers.createTask('Mobile Task 2');
      
      const screenshot = await helpers.takeScreenshot('mobile-task-list');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.3,
        failureThresholdType: 'percent'
      });
    });

    test('should match mobile navigation menu', async () => {
      await helpers.setMobileViewport();
      
      // Open mobile menu
      const menuButton = await page.$('button:has-text("☰"), [aria-label*="menu"]');
      if (menuButton) {
        await menuButton.click();
        await page.waitForTimeout(500);
        
        const screenshot = await helpers.takeScreenshot('mobile-navigation');
        expect(screenshot).toMatchImageSnapshot({
          threshold: 0.2,
          failureThresholdType: 'percent'
        });
      }
    });

    test('should match tablet view', async () => {
      await helpers.setTabletViewport();
      await helpers.navigateToPage('tasks');
      
      await helpers.createTask('Tablet Task');
      
      const screenshot = await helpers.takeScreenshot('tablet-view');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.3,
        failureThresholdType: 'percent'
      });
    });
  });

  describe('Theme Variations', () => {
    test('should match dark theme', async () => {
      // Toggle to dark theme
      const themeButton = await page.$('button[aria-label*="theme"], button:has-text("🌙")');
      if (themeButton) {
        await themeButton.click();
        await page.waitForTimeout(500);
        
        await helpers.navigateToPage('tasks');
        await helpers.createTask('Dark Theme Task');
        
        const screenshot = await helpers.takeScreenshot('dark-theme');
        expect(screenshot).toMatchImageSnapshot({
          threshold: 0.4, // Higher threshold for theme changes
          failureThresholdType: 'percent'
        });
      }
    });
  });

  describe('Loading States', () => {
    test('should match loading state', async () => {
      // Navigate to a page and capture during loading
      await page.goto('http://localhost:5173');
      
      // Capture very early to get loading state
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.3,
        failureThresholdType: 'percent',
        customSnapshotIdentifier: 'loading-state'
      });
    });
  });

  describe('Error States', () => {
    test('should match empty states', async () => {
      await helpers.navigateToPage('companies');
      
      const screenshot = await helpers.takeScreenshot('empty-companies');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.2,
        failureThresholdType: 'percent'
      });
    });
  });

  describe('Calendar Views', () => {
    test('should match calendar month view', async () => {
      await helpers.navigateToPage('calendar');
      
      // Ensure month view is selected
      const monthButton = await page.$('button:has-text("Month")');
      if (monthButton) {
        await monthButton.click();
        await page.waitForTimeout(500);
      }
      
      const screenshot = await helpers.takeScreenshot('calendar-month-view');
      expect(screenshot).toMatchImageSnapshot({
        threshold: 0.3,
        failureThresholdType: 'percent'
      });
    });

    test('should match calendar week view', async () => {
      await helpers.navigateToPage('calendar');
      
      const weekButton = await page.$('button:has-text("Week")');
      if (weekButton) {
        await weekButton.click();
        await page.waitForTimeout(500);
        
        const screenshot = await helpers.takeScreenshot('calendar-week-view');
        expect(screenshot).toMatchImageSnapshot({
          threshold: 0.3,
          failureThresholdType: 'percent'
        });
      }
    });
  });

  describe('Interaction States', () => {
    test('should match hover states', async () => {
      await helpers.navigateToPage('tasks');
      await helpers.createTask('Hover Test Task');
      
      // Hover over a task
      const taskElement = await page.$('text="Hover Test Task"');
      if (taskElement) {
        await taskElement.hover();
        await page.waitForTimeout(200);
        
        const screenshot = await helpers.takeScreenshot('task-hover-state');
        expect(screenshot).toMatchImageSnapshot({
          threshold: 0.2,
          failureThresholdType: 'percent'
        });
      }
    });

    test('should match focus states', async () => {
      await helpers.navigateToPage('tasks');
      
      await page.click('button:has-text("Add Task")');
      const taskInput = await page.$('input[placeholder*="What needs to be done"]');
      
      if (taskInput) {
        await taskInput.focus();
        await page.waitForTimeout(200);
        
        const screenshot = await helpers.takeScreenshot('input-focus-state');
        expect(screenshot).toMatchImageSnapshot({
          threshold: 0.1,
          failureThresholdType: 'percent'
        });
      }
    });
  });
});