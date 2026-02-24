const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log("Navigating to auth...");
    await page.goto('http://localhost:3000/auth');

    console.log("Logging in...");
    await page.type('input[name="email"]', 'cadet@academy.in');
    await page.type('input[name="password"]', 'password123'); // Assuming standard password or we can just hit the OTP

    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    console.log("Navigating to OLQ Report...");
    await page.goto('http://localhost:3000/olq-report');

    console.log("Final URL:", page.url());

    await browser.close();
})();
