const cron = require('node-cron');
const scraper = require('./scraper');
const database = require('./database');

let isScraping = false;

async function triggerScrape() {
    if (isScraping) {
        database.addLog('Scrape already in progress. Skipping trigger.', 'info');
        return;
    }
    
    isScraping = true;
    try {
        const newJobs = await scraper.runScrapeCycle();
        database.addLog(`Hourly automated job scrape finished. Found ${newJobs} new opportunities.`, 'success');
    } catch (err) {
        database.addLog(`Scheduler error during scrape cycle: ${err.message}`, 'error');
    } finally {
        isScraping = false;
    }
}

// Setup Cron Job: run every hour at minute 0
// Pattern: '0 * * * *'
function startScheduler() {
    database.addLog('Initializing hourly scheduler...', 'info');
    cron.schedule('0 * * * *', () => {
        database.addLog('Hourly cron trigger fired!', 'info');
        triggerScrape();
    });

    // Also fire a scrape on launch (after a brief delay to let everything bind)
    setTimeout(() => {
        database.addLog('Running initial scrape cycle on launch...', 'info');
        triggerScrape();
    }, 5000);
}

module.exports = {
    startScheduler,
    triggerScrape
};
