const puppeteer = require('puppeteer');
const database = require('./database');

async function autofillForm(jobUrl) {
    database.addLog(`Starting autofill workflow for: ${jobUrl}`, 'info');
    const profile = database.getProfile();
    let browser;
    
    try {
        // Launch in headful mode so the user can see it autofilling!
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        
        database.addLog('Analyzing application page fields...', 'info');
        
        // Wait for page to be interactive
        await page.evaluate(async (profile) => {
            const delay = ms => new Promise(res => setTimeout(res, ms));
            
            // Helper to check if string contains any of search terms
            const contains = (str, list) => list.some(item => str.toLowerCase().includes(item));
            
            const nameTerms = ['name', 'full name', 'first name', 'fullname'];
            const emailTerms = ['email', 'e-mail', 'email address'];
            const phoneTerms = ['phone', 'mobile', 'tel', 'contact', 'number'];
            const githubTerms = ['github', 'git'];
            const linkedinTerms = ['linkedin', 'linkedin profile'];
            
            const inputs = document.querySelectorAll('input, textarea');
            
            for (const input of inputs) {
                const id = input.id || '';
                const name = input.name || '';
                const placeholder = input.placeholder || '';
                const label = input.labels ? Array.from(input.labels).map(l => l.innerText).join(' ') : '';
                const searchStr = `${id} ${name} ${placeholder} ${label}`.toLowerCase();
                
                // Autofill standard textual values
                if (input.type === 'text' || input.type === 'email' || input.type === 'tel' || input.tagName === 'TEXTAREA') {
                    if (contains(searchStr, nameTerms) && !contains(searchStr, ['company', 'school', 'college'])) {
                        input.value = profile.name;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (contains(searchStr, emailTerms)) {
                        input.value = profile.email;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (contains(searchStr, phoneTerms)) {
                        input.value = profile.phone;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (contains(searchStr, githubTerms)) {
                        input.value = profile.github;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (contains(searchStr, linkedinTerms)) {
                        input.value = profile.linkedin;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (contains(searchStr, ['cover letter', 'coverletter', 'pitch', 'about you', 'introduce yourself'])) {
                        input.value = profile.coverLetterTemplate;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        }, profile);

        database.addLog('Autofill complete. Browser left open for user review and final submission.', 'success');
        
        // Return browser reference or keep it running so it doesn't close immediately.
        // We will resolve immediately, but the browser will stay open because we don't call browser.close() in success path!
        return { success: true, message: "Browser launched and autofilled. You can review and apply." };
    } catch (err) {
        database.addLog(`Autofill error: ${err.message}`, 'error');
        if (browser) await browser.close();
        throw err;
    }
}

module.exports = {
    autofillForm
};
