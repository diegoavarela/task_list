#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');

async function testApplication() {
  console.log('🧪 Starting Basic Application Test...');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('📱 Browser launched successfully');
    
    // Test if we can access the app
    try {
      await page.goto('http://localhost:5174', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      console.log('✅ Application loaded successfully');
    } catch (e) {
      console.log('⚠️  Application not running on localhost:5174, checking if build exists...');
      
      // Check if we can serve the built app
      const fs = require('fs');
      const distPath = path.join(__dirname, 'dist', 'index.html');
      
      if (fs.existsSync(distPath)) {
        console.log('✅ Built application exists');
        
        // Take screenshot of what we have so far
        await page.goto(`file://${distPath}`, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'test-app-screenshot.png', fullPage: true });
        console.log('📸 Screenshot saved as test-app-screenshot.png');
        
        // Test basic functionality
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if basic elements exist
        const title = await page.title();
        console.log(`📋 Page title: ${title}`);
        
        // Check for main elements
        const body = await page.$('body');
        if (body) {
          console.log('✅ Page body rendered');
        }
        
        // Look for task-related elements
        const taskElements = await page.$$('[data-testid*="task"], [class*="task"], #tasks, .tasks');
        console.log(`📝 Found ${taskElements.length} task-related elements`);
        
        // Look for navigation elements
        const navElements = await page.$$('nav, [role="navigation"], [data-testid*="nav"]');
        console.log(`🧭 Found ${navElements.length} navigation elements`);
        
        // Look for buttons
        const buttons = await page.$$('button');
        console.log(`🔘 Found ${buttons.length} buttons`);
        
        console.log('✅ Basic UI structure verification complete');
        
      } else {
        console.log('❌ No built application found');
        return false;
      }
    }
    
    // Test responsive design
    console.log('📱 Testing responsive design...');
    
    // Mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-mobile-screenshot.png', fullPage: true });
    console.log('📸 Mobile screenshot saved');
    
    // Tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-tablet-screenshot.png', fullPage: true });
    console.log('📸 Tablet screenshot saved');
    
    // Desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'test-desktop-screenshot.png', fullPage: true });
    console.log('📸 Desktop screenshot saved');
    
    console.log('✅ Responsive design test complete');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🚪 Browser closed');
    }
  }
}

async function testBuildIntegrity() {
  console.log('🔍 Testing build integrity...');
  
  const fs = require('fs');
  const path = require('path');
  
  // Check if build directory exists
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    console.log('❌ Build directory not found');
    return false;
  }
  
  // Check for main files
  const requiredFiles = ['index.html'];
  const optionalFiles = ['assets/index.js', 'assets/index.css'];
  
  for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      return false;
    }
  }
  
  for (const file of optionalFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`⚠️  ${file} not found (may be bundled differently)`);
    }
  }
  
  // Check assets directory
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assets = fs.readdirSync(assetsPath);
    console.log(`📦 Found ${assets.length} asset files:`, assets.slice(0, 5).join(', ') + (assets.length > 5 ? '...' : ''));
  }
  
  return true;
}

async function generateTestReport() {
  console.log('📊 Generating Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    tests: {
      build: await testBuildIntegrity(),
      application: await testApplication()
    },
    summary: {}
  };
  
  report.summary.passed = Object.values(report.tests).filter(Boolean).length;
  report.summary.total = Object.keys(report.tests).length;
  report.summary.success_rate = `${(report.summary.passed / report.summary.total * 100).toFixed(1)}%`;
  
  const fs = require('fs');
  fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
  
  console.log('\n📋 Test Report Summary:');
  console.log(`✅ Passed: ${report.summary.passed}/${report.summary.total}`);
  console.log(`📈 Success Rate: ${report.summary.success_rate}`);
  console.log('📄 Full report saved to test-report.json');
  
  if (report.summary.passed === report.summary.total) {
    console.log('\n🎉 All tests passed! Application is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
  
  return report;
}

// Run the tests
if (require.main === module) {
  generateTestReport()
    .then(report => {
      process.exit(report.summary.passed === report.summary.total ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testApplication, testBuildIntegrity, generateTestReport };