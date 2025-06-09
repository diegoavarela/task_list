import { Page } from 'puppeteer';

export class TestHelpers {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToApp() {
    await this.page.goto('http://localhost:5173');
    await this.page.waitForSelector('[data-testid="app"]', { timeout: 10000 });
  }

  async navigateToPage(pageName: 'tasks' | 'companies' | 'tags' | 'calendar' | 'analytics' | 'billing') {
    const pageButton = `button:has-text("${pageName.charAt(0).toUpperCase() + pageName.slice(1)}")`;
    await this.page.click(pageButton);
    await this.page.waitForTimeout(500);
  }

  // Task management helpers
  async createTask(taskName: string, companyName: string = 'Test Company') {
    // Click Add Task button
    await this.page.click('button:has-text("Add Task")');
    await this.page.waitForSelector('input[placeholder*="What needs to be done"]');
    
    // Fill task details
    await this.page.fill('input[placeholder*="What needs to be done"]', taskName);
    
    // Select company (assuming first company if exists)
    await this.page.click('button:has-text("Select company")');
    await this.page.waitForTimeout(300);
    
    // Try to select existing company or create if needed
    try {
      await this.page.click(`text="${companyName}"`);
    } catch {
      // If company doesn't exist, select first available
      await this.page.click('div[role="option"]:first-child');
    }
    
    // Submit task
    await this.page.click('button:has-text("Add Task")');
    await this.page.waitForTimeout(500);
  }

  async editTask(taskName: string, newName: string) {
    // Find and click edit button for the task
    const taskElement = await this.page.waitForSelector(`text="${taskName}"`);
    const parentCard = await taskElement?.evaluateHandle(el => el.closest('.task-item'));
    
    if (parentCard) {
      const editButton = await parentCard.$('button[title*="Edit"]');
      await editButton?.click();
      
      // Wait for edit dialog
      await this.page.waitForSelector('input[value*="' + taskName + '"]');
      
      // Clear and enter new name
      await this.page.fill('input[value*="' + taskName + '"]', newName);
      
      // Save changes
      await this.page.click('button:has-text("Save Changes")');
      await this.page.waitForTimeout(500);
    }
  }

  async deleteTask(taskName: string) {
    const taskElement = await this.page.waitForSelector(`text="${taskName}"`);
    const parentCard = await taskElement?.evaluateHandle(el => el.closest('.task-item'));
    
    if (parentCard) {
      const deleteButton = await parentCard.$('button[title*="Delete"]');
      await deleteButton?.click();
      
      // Confirm deletion
      await this.page.waitForSelector('button:has-text("Delete")');
      await this.page.click('button:has-text("Delete")');
      await this.page.waitForTimeout(500);
    }
  }

  async toggleTaskCompletion(taskName: string) {
    const taskElement = await this.page.waitForSelector(`text="${taskName}"`);
    const parentCard = await taskElement?.evaluateHandle(el => el.closest('.task-item'));
    
    if (parentCard) {
      const checkbox = await parentCard.$('.task-checkbox');
      await checkbox?.click();
      await this.page.waitForTimeout(300);
    }
  }

  // Company management helpers
  async createCompany(name: string, color: string = '#3b82f6') {
    await this.navigateToPage('companies');
    await this.page.click('button:has-text("Add Company")');
    
    await this.page.waitForSelector('input[placeholder*="company name"]');
    await this.page.fill('input[placeholder*="company name"]', name);
    
    // Set color if color picker exists
    try {
      await this.page.click(`div[style*="${color}"]`);
    } catch {
      // Fallback if color picker is different
    }
    
    await this.page.click('button:has-text("Add Company")');
    await this.page.waitForTimeout(500);
  }

  // Tag management helpers
  async createTag(name: string, color: string = '#10b981') {
    await this.navigateToPage('tags');
    await this.page.click('button:has-text("Add Tag")');
    
    await this.page.waitForSelector('input[placeholder*="tag name"]');
    await this.page.fill('input[placeholder*="tag name"]', name);
    
    await this.page.click('button:has-text("Create Tag")');
    await this.page.waitForTimeout(500);
  }

  // Screenshot helpers
  async takeScreenshot(name: string, options = {}) {
    return await this.page.screenshot({
      path: `tests/screenshots/${name}.png`,
      fullPage: true,
      ...options
    });
  }

  async takeElementScreenshot(selector: string, name: string) {
    const element = await this.page.$(selector);
    if (element) {
      return await element.screenshot({
        path: `tests/screenshots/${name}.png`
      });
    }
  }

  // Data persistence helpers
  async getLocalStorageData(key: string) {
    return await this.page.evaluate((storageKey) => {
      return localStorage.getItem(storageKey);
    }, key);
  }

  async setLocalStorageData(key: string, value: string) {
    await this.page.evaluate((storageKey, storageValue) => {
      localStorage.setItem(storageKey, storageValue);
    }, key, value);
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  // Wait helpers
  async waitForElement(selector: string, timeout = 5000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout = 5000) {
    return await this.page.waitForSelector(`text="${text}"`, { timeout });
  }

  // Form helpers
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `input[name="${field}"], input[placeholder*="${field}"], textarea[name="${field}"]`;
      await this.page.fill(selector, value);
    }
  }

  // Mobile testing helpers
  async setMobileViewport() {
    await this.page.setViewport({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewport({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewport({ width: 1280, height: 720 });
  }

  // Performance helpers
  async measurePageLoad() {
    const performance = await this.page.evaluate(() => {
      return {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0
      };
    });
    return performance;
  }

  // Accessibility helpers
  async checkAccessibility() {
    // Basic accessibility checks
    const issues = await this.page.evaluate(() => {
      const issues = [];
      
      // Check for images without alt text
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        issues.push(`${images.length} images without alt text`);
      }
      
      // Check for buttons without accessible names
      const buttons = document.querySelectorAll('button:not([aria-label]):not([title])');
      const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent?.trim());
      if (buttonsWithoutText.length > 0) {
        issues.push(`${buttonsWithoutText.length} buttons without accessible names`);
      }
      
      // Check for form inputs without labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([title])');
      const inputsWithoutLabels = Array.from(inputs).filter(input => {
        const id = input.getAttribute('id');
        return !id || !document.querySelector(`label[for="${id}"]`);
      });
      if (inputsWithoutLabels.length > 0) {
        issues.push(`${inputsWithoutLabels.length} inputs without labels`);
      }
      
      return issues;
    });
    
    return issues;
  }
}