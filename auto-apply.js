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
            args: ['--start-maximized', '--no-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Navigate with error resilience — some pages redirect or abort
        try {
            await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (navErr) {
            database.addLog(`Navigation warning (page may still work): ${navErr.message}`, 'warning');
            // Don't throw — many pages partially load but still function
        }
        
        // Give page time to render
        await new Promise(r => setTimeout(r, 2000));
        
        database.addLog('Analyzing application page fields...', 'info');
        
        // Autofill form fields
        try {
            await page.evaluate(async (profile) => {
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
        } catch (evalErr) {
            database.addLog(`Autofill field scan partial: ${evalErr.message}`, 'warning');
        }

        database.addLog('Autofill complete. Browser left open for user review and final submission.', 'success');
        
        // Browser stays open — user reviews and submits manually
        return { success: true, message: "Browser launched and autofilled. You can review and apply." };
    } catch (err) {
        database.addLog(`Autofill error: ${err.message}`, 'error');
        if (browser) {
            try { await browser.close(); } catch(_) {}
        }
        // Return error instead of throwing — prevents server crash
        return { success: false, message: err.message };
    }
}

module.exports = {
    autofillForm
};
