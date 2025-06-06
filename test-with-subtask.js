const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 900 });
  
  try {
    await page.goto('http://localhost:5173');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add sample companies and tasks with subtasks
    await page.evaluate(() => {
      // Add companies
      const companies = [{
        id: '1',
        name: 'Test Company',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('companies', JSON.stringify(companies));
      
      // Add tasks with subtasks
      const tasks = [{
        id: '1',
        name: 'Main Task with Subtasks',
        companyId: '1',
        completed: false,
        subtasks: [{
          id: '2',
          name: 'First Subtask with Buttons',
          companyId: '1',
          completed: false,
          subtasks: [],
          parentTaskId: '1',
          tagIds: [],
          createdAt: new Date().toISOString()
        }, {
          id: '3',
          name: 'Second Subtask (Completed)',
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
    });
    
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click to expand the task to show subtasks
    await page.click('button[aria-expanded="false"], .task-item'); // Try to expand
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: 'subtask-test-screenshot.png',
      fullPage: true
    });
    
    console.log('Subtask test screenshot saved as subtask-test-screenshot.png');
  } catch (error) {
    console.log('Error:', error);
  }
  
  await browser.close();
})();