const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'comments-test-initial.png', fullPage: true });
    
    // Click Add Task button
    await page.click('button:contains("Add Task")');
    await page.waitForTimeout(500);
    
    // Fill in task details
    await page.type('input[placeholder="What needs to be done?"]', 'Test Task for Comments');
    
    // Select a company
    await page.click('button[role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('[role="option"]:first-child');
    
    // Add the task
    const addTaskButtons = await page.$$('button');
    for (let button of addTaskButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Add Task')) {
        await button.click();
        break;
      }
    }
    await page.waitForTimeout(1000);
    
    // Find and click edit button for the first task
    const editButton = await page.$('button[title*="Edit"], button svg[data-testid="edit"]');
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
    
    // Look for Comments tab
    const commentsTab = await page.$('button:contains("Comments")');
    if (commentsTab) {
      await commentsTab.click();
      await page.waitForTimeout(500);
    }
    
    // Take screenshot of the edit dialog
    await page.screenshot({ path: 'comments-test-dialog.png', fullPage: true });
    
    console.log('Screenshots taken successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'comments-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();