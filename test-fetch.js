const fetch = require('node-fetch'); // Next.js polyfills this globally in 18+, but let's just use pure node fetch if available or native fetch
// native fetch is available in Node 18+

async function run() {
    try {
        console.log("Fetching from localhost:3000...");
        const res = await fetch('http://localhost:3000/api/cron/update-news', {
            headers: {
                'Authorization': 'Bearer MDAlyDyTQ4nQ7f7h7S5II20pa/cdD91h1euJQrc1huw='
            }
        });
        const text = await res.text();
        console.log("Response:", res.status, text);
    } catch (e) {
        console.error("Failed to connect. Make sure your local Next.js dev server is running on port 3000. Error:", e.message);
    }
}

run();
