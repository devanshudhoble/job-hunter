const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const database = require('./database');
const scraper = require('./scraper');
const scheduler = require('./scheduler');
const { autofillForm } = require('./auto-apply');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. JOBS ENDPOINT
app.get('/api/jobs', (req, res) => {
    try {
        const jobs = database.getJobs();
        res.json({ success: true, data: jobs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. PROFILE ENDPOINT (GET & POST)
app.get('/api/profile', (req, res) => {
    try {
        const profile = database.getProfile();
        res.json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/profile', (req, res) => {
    try {
        const profile = req.body;
        database.saveProfile(profile);
        database.addLog('User profile updated successfully.', 'success');
        res.json({ success: true, message: 'Profile saved successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. STATS & LOGS
app.get('/api/stats', (req, res) => {
    try {
        const stats = database.getStats();
        res.json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/logs', (req, res) => {
    try {
        const logs = database.getLogs();
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. ACTION TRIGGERS
app.post('/api/scrape', async (req, res) => {
    try {
        database.addLog('Manual scrape cycle requested.', 'info');
        // Run asynchronously so user doesn't wait for HTTP timeout
        scraper.runScrapeCycle();
        res.json({ success: true, message: 'Scrape started in background.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/apply', async (req, res) => {
    const { link, title, company } = req.body;
    if (!link) {
        return res.status(400).json({ success: false, message: 'Link is required' });
    }

    try {
        // Fire-and-forget with safe error handling — browser stays open for user
        autofillForm(link).catch(err => {
            database.addLog(`Auto-apply background error for ${title}: ${err.message}`, 'error');
        });
        
        // Update job status in database
        const jobs = database.getJobs();
        const updated = jobs.map(j => {
            if (j.link === link) {
                j.status = 'Applied';
            }
            return j;
        });
        database.saveJobs(updated);
        database.addLog(`Applying to: ${title} at ${company}. Browser window opened.`, 'success');

        res.json({ success: true, message: `Autofill browser opened for ${title} at ${company}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/ignore', (req, res) => {
    const { link } = req.body;
    try {
        const jobs = database.getJobs();
        const updated = jobs.map(j => {
            if (j.link === link) {
                j.status = 'Ignored';
            }
            return j;
        });
        database.saveJobs(updated);
        res.json({ success: true, message: 'Job marked as Ignored' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Start server and cron scheduler
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    database.addLog(`Server started on port ${PORT}`, 'info');
    scheduler.startScheduler();
});
