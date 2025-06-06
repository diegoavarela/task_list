const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all errors
  page.on('console', (msg) => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', (error) => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // First add a company
    console.log('Navigating to Companies page...');
    await page.click('button:has-text("Companies"), a[href*="companies"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Adding a company...');
    await page.fill('input[placeholder*="company"]', 'Test Company');
    await page.click('button:has-text("Add Company")');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Go back to tasks
    console.log('Going back to Tasks...');
    await page.click('button:has-text("Tasks"), a[href*="tasks"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to add a task
    console.log('Trying to add a task...');
    await page.click('button:has-text("Add Task")');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.fill('input[placeholder*="What needs"]', 'Test Task');
    await page.click('[role="combobox"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('text=Test Company');
    await page.click('button:has-text("Add Task")');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Task addition completed successfully!');
    
    await page.screenshot({ path: 'test-add-task-success.png' });
    
  } catch (error) {
    console.log('Error during task addition:', error.message);
    await page.screenshot({ path: 'test-add-task-error.png' });
  }
  
  await browser.close();
})();