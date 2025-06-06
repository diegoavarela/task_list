const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add sample companies, tasks and subtasks
    await page.evaluate(() => {
      const companies = [{
        id: '1',
        name: 'Test Company',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('companies', JSON.stringify(companies));
      
      const tasks = [{
        id: '1',
        name: 'Main Task with Subtasks',
        companyId: '1',
        completed: false,
        subtasks: [{
          id: '2',
          name: 'First Subtask',
          companyId: '1',
          completed: false,
          subtasks: [],
          parentTaskId: '1',
          tagIds: [],
          createdAt: new Date().toISOString()
        }, {
          id: '3',
          name: 'Second Subtask',
          companyId: '1',
          completed: true,
          subtasks: [],
          parentTaskId: '1',
          tagIds: [],
          createdAt: new Date().toISOString()
        }],
        tagIds: [],
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      
      // Set expanded tasks to show subtasks
      const expandedTasks = ['1'];
      localStorage.setItem('expandedTasks', JSON.stringify(expandedTasks));
    });
    
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Close keyboard shortcuts modal if it exists
    try {
      await page.click('button[aria-label="Close"], .modal button, [data-dismiss]');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      // Modal might not be open
    }
    
    await page.screenshot({ 
      path: 'final-test-screenshot.png',
      fullPage: true
    });
    
    console.log('Final test screenshot saved as final-test-screenshot.png');
  } catch (error) {
    console.log('Error:', error);
  }
  
  await browser.close();
})();