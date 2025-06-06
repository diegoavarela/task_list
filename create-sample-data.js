const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    
    // First create a company
    await page.click('a[href*="companies"], button:has-text("Companies")');
    await page.waitForTimeout(1000);
    
    // Add a company
    await page.fill('input[placeholder*="company name"], input[placeholder*="Enter company"]', 'Test Company');
    await page.click('button:has-text("Add Company")');
    await page.waitForTimeout(1000);
    
    // Go back to tasks
    await page.click('a[href*="tasks"], button:has-text("Tasks")');
    await page.waitForTimeout(1000);
    
    // Add a task
    await page.click('button:has-text("Add Task")');
    await page.waitForTimeout(500);
    
    await page.fill('input[placeholder*="What needs"]', 'Sample Task with Buttons');
    await page.click('.select-trigger, [role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('div:has-text("Test Company")');
    await page.click('button:has-text("Add Task")');
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'tasks-with-buttons-screenshot.png',
      fullPage: true
    });
    
    console.log('Screenshot with tasks saved as tasks-with-buttons-screenshot.png');
  } catch (error) {
    console.log('Error creating sample data:', error);
    await page.screenshot({ 
      path: 'error-screenshot.png',
      fullPage: true
    });
  }
  
  await browser.close();
})();