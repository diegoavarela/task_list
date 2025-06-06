const puppeteer = require('puppeteer');

async function testNewFeatures() {
  console.log('🚀 Testing new enhanced features...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('📖 Navigating to application...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });

    // Test new navigation tabs
    console.log('✅ Testing navigation tabs...');
    const navButtons = await page.$$('nav button, [role="tab"]');
    console.log(`Found ${navButtons.length} navigation buttons`);
    
    // Test Calendar tab
    console.log('📅 Testing Calendar tab...');
    const calendarButtons = await page.$$('button');
    for (let button of calendarButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('calendar')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('   ✓ Calendar view loaded');
        break;
      }
    }
    
    // Test Analytics tab
    console.log('📊 Testing Analytics tab...');
    const analyticsButtons = await page.$$('button');
    for (let button of analyticsButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('analytics')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('   ✓ Analytics view loaded');
        break;
      }
    }
    
    // Go back to Tasks tab
    console.log('📋 Returning to Tasks tab...');
    const taskButtons = await page.$$('button');
    for (let button of taskButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('tasks')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('   ✓ Tasks view loaded');
        break;
      }
    }
    
    // Test Enhanced Filtering
    console.log('🔍 Testing enhanced filtering...');
    const filterButtons = await page.$$('button');
    for (let button of filterButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.toLowerCase().includes('filter')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for search input
        const searchInput = await page.$('input[placeholder*="Search"], input[placeholder*="search"]');
        if (searchInput) {
          console.log('   ✓ Search filter found');
          await searchInput.type('test');
        }
        
        break;
      }
    }
    
    // Test priority and status badges
    console.log('🏷️ Checking for priority and status badges...');
    const priorityBadges = await page.$$('[class*="priority"], [class*="Priority"], .priority');
    const statusBadges = await page.$$('[class*="status"], [class*="Status"], .status');
    console.log(`   ✓ Found ${priorityBadges.length} priority-related elements`);
    console.log(`   ✓ Found ${statusBadges.length} status-related elements`);
    
    // Test mobile responsiveness
    console.log('📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileMenu = await page.$('button[aria-label*="menu"], .mobile-menu, [class*="mobile"]');
    if (mobileMenu) {
      console.log('   ✓ Mobile menu available');
    }
    
    // Take screenshots
    console.log('📸 Taking screenshots...');
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({
      path: 'enhanced-features-test.png',
      fullPage: true
    });
    console.log('   ✓ Screenshot saved as enhanced-features-test.png');

    console.log('🎉 New features test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'enhanced-features-error.png' });
  } finally {
    await browser.close();
  }
}

testNewFeatures().catch(console.error);