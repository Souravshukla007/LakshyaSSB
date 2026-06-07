import * as dotenv from 'dotenv';
dotenv.config();

async function triggerCron() {
    console.log("Triggering Cron Pipeline with CRON_SECRET...");
    try {
        const res = await fetch('http://localhost:3000/api/cron/update-news', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        });
        
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Failed to trigger API:", err);
    }
}

triggerCron();
