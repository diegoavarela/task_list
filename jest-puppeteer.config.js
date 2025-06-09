module.exports = {
  launch: {
    headless: process.env.CI === 'true',
    slowMo: process.env.CI === 'true' ? 0 : 50,
    devtools: process.env.CI !== 'true',
    defaultViewport: {
      width: 1280,
      height: 720
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  server: {
    command: 'npm run dev',
    port: 5173,
    launchTimeout: 10000,
    debug: true,
  },
  browserContext: 'default',
};