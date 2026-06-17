const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const database = require('./database');
const { calculateScore } = require('./scorer');

// User agents rotation to avoid bot detection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
];

function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// Axios helper with retry
async function safeGet(url, headers = {}, timeout = 15000) {
    return axios.get(url, {
        headers: { 'User-Agent': getRandomUA(), 'Accept-Language': 'en-US,en;q=0.9', ...headers },
        timeout
    });
}

// ═══════════════════════════════════════════════════════════════
// 1. LINKEDIN — Guest public job search API
// ═══════════════════════════════════════════════════════════════
async function scrapeLinkedIn(keyword, location = 'India') {
    const jobs = [];
    try {
        database.addLog(`[LinkedIn] Scraping for "${keyword}"...`, 'info');
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword + ' fresher')}&location=${encodeURIComponent(location)}&f_TPR=r86400&f_E=1,2&start=0`;
        const res = await safeGet(url);
        const $ = cheerio.load(res.data);

        $('li').each((i, el) => {
            const title = $(el).find('.base-search-card__title').text().trim();
            const company = $(el).find('.base-search-card__subtitle').text().trim();
            const loc = $(el).find('.job-search-card__location').text().trim();
            const link = $(el).find('.base-card__full-link').attr('href') || '';
            const posted = $(el).find('.job-search-card__listdate').text().trim() ||
                           $(el).find('.job-search-card__listdate--new').text().trim();
            if (title && company && link) {
                jobs.push({
                    title, company, location: loc,
                    link: link.split('?')[0],
                    portal: 'LinkedIn', salary: 'Not Disclosed',
                    description: `${title} at ${company}. ${loc}. Posted: ${posted}`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            }
        });
        database.addLog(`[LinkedIn] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[LinkedIn] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 2. INTERNSHALA — Best for Indian freshers & internships
// ═══════════════════════════════════════════════════════════════
async function scrapeInternshala(keyword) {
    const jobs = [];
    try {
        database.addLog(`[Internshala] Scraping for "${keyword}"...`, 'info');
        const slug = keyword.replace(/\s+/g, '-').toLowerCase();
        const url = `https://internshala.com/jobs/${slug}-fresher-jobs/`;
        const res = await safeGet(url);
        const $ = cheerio.load(res.data);

        $('.individual_internship').each((i, el) => {
            const title = $(el).find('.job-internship-name a').text().trim();
            const company = $(el).find('.company-name').text().trim();
            const loc = $(el).find('.locations').text().trim();
            let href = $(el).find('.job-internship-name a').attr('href') || '';
            const link = href ? `https://internshala.com${href}` : '';
            const salary = $(el).find('.salary_container .desktop').text().trim() || 'Not Disclosed';

            if (title && company && link) {
                jobs.push({
                    title, company, location: loc, link,
                    portal: 'Internshala', salary,
                    description: `${title} at ${company}. Location: ${loc}. CTC: ${salary}`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            }
        });
        database.addLog(`[Internshala] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[Internshala] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 3. UNSTOP — Active Indian portal for freshers, competitions, jobs
// ═══════════════════════════════════════════════════════════════
async function scrapeUnstop(keyword) {
    const jobs = [];
    try {
        database.addLog(`[Unstop] Scraping for "${keyword}"...`, 'info');
        const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&search=${encodeURIComponent(keyword)}&per_page=20`;
        const res = await safeGet(url, { 'Referer': 'https://unstop.com/' });

        if (res.data?.data?.data) {
            res.data.data.data.forEach(opp => {
                const title = opp.title;
                const company = opp.organisation?.name || 'Unstop Partner';
                const link = `https://unstop.com/o/${opp.id}`;
                const loc = opp.job_locations?.join(', ') || 'India';

                jobs.push({
                    title, company, location: loc, link,
                    portal: 'Unstop',
                    salary: opp.salary_compensation || 'Not Disclosed',
                    description: `Type: ${opp.job_type || 'Job'}. ${opp.eligibility || 'Graduates / Freshers'}`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            });
        }
        database.addLog(`[Unstop] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[Unstop] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 4. WE WORK REMOTELY — RSS Feed for remote developer jobs
// ═══════════════════════════════════════════════════════════════
async function scrapeWWR(keyword) {
    const jobs = [];
    try {
        database.addLog(`[WeWorkRemotely] Scraping for "${keyword}"...`, 'info');
        const res = await safeGet('https://weworkremotely.com/categories/remote-programming-jobs.rss');
        const $ = cheerio.load(res.data, { xmlMode: true });

        $('item').each((i, el) => {
            const title = $(el).find('title').text().trim();
            const link = $(el).find('link').text().trim();
            const desc = $(el).find('description').text();
            const pubDate = $(el).find('pubDate').text();
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');

            if (regex.test(title) || regex.test(desc)) {
                const parts = title.split(':');
                jobs.push({
                    title: parts[1] ? parts[1].trim() : title,
                    company: parts[0] ? parts[0].trim() : 'Remote Company',
                    location: 'Remote (Global)', link,
                    portal: 'WeWorkRemotely', salary: 'Not Disclosed',
                    description: desc.substring(0, 500),
                    status: 'New', dateFound: new Date(pubDate || Date.now()).toISOString()
                });
            }
        });
        database.addLog(`[WeWorkRemotely] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[WeWorkRemotely] Error: ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 5. REMOTIVE — API for remote tech jobs
// ═══════════════════════════════════════════════════════════════
async function scrapeRemotive(keyword) {
    const jobs = [];
    try {
        database.addLog(`[Remotive] Scraping for "${keyword}"...`, 'info');
        const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=20`;
        const res = await safeGet(url);

        if (res.data?.jobs) {
            res.data.jobs.forEach(j => {
                jobs.push({
                    title: j.title,
                    company: j.company_name,
                    location: j.candidate_required_location || 'Remote (Worldwide)',
                    link: j.url,
                    portal: 'Remotive',
                    salary: j.salary || 'Not Disclosed',
                    description: (j.description || '').replace(/<[^>]*>/g, '').substring(0, 500),
                    status: 'New', dateFound: j.publication_date || new Date().toISOString()
                });
            });
        }
        database.addLog(`[Remotive] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[Remotive] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 6. FRESHERSWORLD — Dedicated Indian freshers job portal
// ═══════════════════════════════════════════════════════════════
async function scrapeFreshersworld(keyword) {
    const jobs = [];
    try {
        database.addLog(`[Freshersworld] Scraping for "${keyword}"...`, 'info');
        const slug = keyword.replace(/\s+/g, '-').toLowerCase();
        const url = `https://www.freshersworld.com/jobs/search/${slug}`;
        const res = await safeGet(url);
        const $ = cheerio.load(res.data);

        $('.job-container .latest-jobs, .job_listing_block').each((i, el) => {
            const title = $(el).find('.wrap-title, .job-title, h3 a, .job_title').text().trim();
            const company = $(el).find('.company-name, .latest-jobs-company, .comp_name').text().trim();
            const loc = $(el).find('.location-type, .job-location, .loc_nam').text().trim();
            let href = $(el).find('a').attr('href') || '';
            const link = href.startsWith('http') ? href : `https://www.freshersworld.com${href}`;

            if (title && link && link !== 'https://www.freshersworld.com') {
                jobs.push({
                    title, company: company || 'Company via Freshersworld',
                    location: loc || 'India', link,
                    portal: 'Freshersworld', salary: 'Not Disclosed',
                    description: `${title} - Fresher opening. ${loc}`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            }
        });
        database.addLog(`[Freshersworld] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[Freshersworld] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 7. TIMESJOBS — Massive Indian job board
// ═══════════════════════════════════════════════════════════════
async function scrapeTimesJobs(keyword) {
    const jobs = [];
    try {
        database.addLog(`[TimesJobs] Scraping for "${keyword}"...`, 'info');
        const url = `https://www.timesjobs.com/candidate/job-search.html?searchType=personal498&from=submit&txtKeywords=${encodeURIComponent(keyword)}&cboWorkExp1=0&cboWorkExp2=1`;
        const res = await safeGet(url);
        const $ = cheerio.load(res.data);

        $('.job-bx.wht-shd-bx').each((i, el) => {
            const title = $(el).find('header.clearfix h2 a').text().trim();
            const company = $(el).find('.joblist-comp-name').text().trim().split('\n')[0].trim();
            const loc = $(el).find('.location-geo, ul.top-jd-dtl li span').text().trim();
            const link = $(el).find('header.clearfix h2 a').attr('href') || '';
            const salary = $(el).find('.mob-salary, .sal').text().trim() || 'Not Disclosed';

            if (title && link) {
                jobs.push({
                    title, company: company || 'Company via TimesJobs',
                    location: loc || 'India', link,
                    portal: 'TimesJobs', salary,
                    description: `${title} at ${company}. Experience: 0-1 yrs. ${loc}`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            }
        });
        database.addLog(`[TimesJobs] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[TimesJobs] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 8. GLASSDOOR — Public job listing scraper
// ═══════════════════════════════════════════════════════════════
async function scrapeGlassdoor(keyword) {
    const jobs = [];
    try {
        database.addLog(`[Glassdoor] Scraping for "${keyword}"...`, 'info');
        const slug = keyword.replace(/\s+/g, '-').toLowerCase();
        const url = `https://www.glassdoor.co.in/Job/${slug}-jobs-SRCH_KO0,${slug.length}.htm?seniorityType=entrylevel`;
        const res = await safeGet(url);
        const $ = cheerio.load(res.data);

        $('[data-test="jobListing"], .react-job-listing').each((i, el) => {
            const title = $(el).find('[data-test="job-title"], .jobTitle').text().trim();
            const company = $(el).find('.EmployerProfile_compactEmployerName__LE242, .employerName').text().trim();
            const loc = $(el).find('.EmployerProfile_employerLocation__HHkRH, .loc').text().trim();
            let href = $(el).find('a').attr('href') || '';
            const link = href.startsWith('http') ? href : `https://www.glassdoor.co.in${href}`;

            if (title && link) {
                jobs.push({
                    title, company: company || 'Company via Glassdoor',
                    location: loc || 'India', link,
                    portal: 'Glassdoor', salary: 'Not Disclosed',
                    description: `${title} at ${company}. Entry Level. ${loc}`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            }
        });
        database.addLog(`[Glassdoor] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[Glassdoor] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 9. HACKEREARTH — Tech/ML competitions & jobs
// ═══════════════════════════════════════════════════════════════
async function scrapeHackerEarth(keyword) {
    const jobs = [];
    try {
        database.addLog(`[HackerEarth] Scraping for "${keyword}"...`, 'info');
        const url = `https://www.hackerearth.com/challenges/jobs/?sort_by=-posted_on&search=${encodeURIComponent(keyword)}`;
        const res = await safeGet(url);
        const $ = cheerio.load(res.data);

        $('.challenge-card-modern, .job-card').each((i, el) => {
            const title = $(el).find('.challenge-name, .job-title, h4').text().trim();
            const company = $(el).find('.company-name, .company, .org-name').text().trim();
            let href = $(el).find('a').attr('href') || '';
            const link = href.startsWith('http') ? href : `https://www.hackerearth.com${href}`;

            if (title && link) {
                jobs.push({
                    title, company: company || 'Company via HackerEarth',
                    location: 'India / Remote', link,
                    portal: 'HackerEarth', salary: 'Not Disclosed',
                    description: `${title} challenge/job from HackerEarth.`,
                    status: 'New', dateFound: new Date().toISOString()
                });
            }
        });
        database.addLog(`[HackerEarth] Found ${jobs.length} jobs for "${keyword}"`, 'success');
    } catch (err) {
        database.addLog(`[HackerEarth] Error for "${keyword}": ${err.message}`, 'error');
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// 10-15. PUPPETEER BROWSER SCRAPERS
// Indeed, Naukri, Wellfound, Cutshort, Instahyre, Shine
// ═══════════════════════════════════════════════════════════════
async function scrapeHeadlessPortals(keywords) {
    const jobs = [];
    let browser;
    try {
        database.addLog(`[Puppeteer] Launching headless browser for Indeed, Naukri, Wellfound, Cutshort, Instahyre, Shine...`, 'info');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent(getRandomUA());
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        // ─── A. INDEED INDIA ───
        for (const keyword of keywords) {
            try {
                database.addLog(`[Indeed] Scraping for "${keyword}"...`, 'info');
                const url = `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword + ' fresher')}&l=&fromage=3&sc=0kf%3Aexplvl(ENTRY_LEVEL)%3B`;
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
                await delay(2000);
                const content = await page.content();
                const $ = cheerio.load(content);

                $('.job_seen_beacon, .css-5lfssm, .resultContent').each((i, el) => {
                    const title = $(el).find('h2.jobTitle span[title], h2.jobTitle span').text().trim();
                    const company = $(el).find('span[data-testid="company-name"], .companyName').text().trim();
                    const loc = $(el).find('[data-testid="text-location"], .companyLocation').text().trim();
                    const jobId = $(el).find('a[data-jk]').attr('data-jk') || '';
                    const link = jobId ? `https://in.indeed.com/viewjob?jk=${jobId}` : '';

                    if (title && company && link) {
                        jobs.push({
                            title, company, location: loc || 'India', link,
                            portal: 'Indeed', salary: 'Not Disclosed',
                            description: `${title} at ${company}. Entry-level. ${loc}`,
                            status: 'New', dateFound: new Date().toISOString()
                        });
                    }
                });
                database.addLog(`[Indeed] Parsed page for "${keyword}"`, 'success');
            } catch (err) {
                database.addLog(`[Indeed] Error for "${keyword}": ${err.message}`, 'error');
            }
            await delay(1500);
        }

        // ─── B. NAUKRI ───
        for (const keyword of keywords.slice(0, 2)) {
            try {
                database.addLog(`[Naukri] Scraping for "${keyword}"...`, 'info');
                const url = `https://www.naukri.com/${keyword.replace(/\s+/g, '-')}-jobs?experience=0`;
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
                await delay(3000);
                const content = await page.content();
                const $ = cheerio.load(content);

                $('[class*="jobTuple"], [class*="cust-job-tuple"], .srp-jobtuple-wrapper, article.jobTuple').each((i, el) => {
                    const title = $(el).find('.title, .desig, a.title, [class*="jobTitle"]').first().text().trim();
                    const company = $(el).find('.comp-name, .subTitle, [class*="companyInfo"] a').first().text().trim();
                    const loc = $(el).find('.loc, .locWdth, [class*="location"]').first().text().trim();
                    let href = $(el).find('a.title, a[class*="title"]').first().attr('href') || '';
                    const link = href.startsWith('http') ? href : '';
                    const salary = $(el).find('.sal, [class*="salary"]').first().text().trim() || 'Not Disclosed';

                    if (title && link) {
                        jobs.push({
                            title, company: company || 'Company via Naukri',
                            location: loc || 'India', link,
                            portal: 'Naukri', salary,
                            description: `${title} at ${company}. Experience: Fresher. ${loc}. Salary: ${salary}`,
                            status: 'New', dateFound: new Date().toISOString()
                        });
                    }
                });
                database.addLog(`[Naukri] Parsed page for "${keyword}"`, 'success');
            } catch (err) {
                database.addLog(`[Naukri] Error for "${keyword}": ${err.message}`, 'error');
            }
            await delay(2000);
        }

        // ─── C. WELLFOUND (AngelList) — Startup jobs ───
        try {
            database.addLog(`[Wellfound] Scraping startup AI/ML roles...`, 'info');
            await page.goto('https://wellfound.com/role/r/machine-learning-engineer', { waitUntil: 'domcontentloaded', timeout: 25000 });
            await delay(3000);
            const content = await page.content();
            const $ = cheerio.load(content);

            $('[class*="styles_jobListingCard"], [class*="job-listing"], .job-card, div[data-test="StartupResult"]').each((i, el) => {
                const title = $(el).find('[class*="title"], h2, h3, a[class*="jobTitle"]').first().text().trim();
                const company = $(el).find('[class*="company"], [class*="startup"], [class*="org"]').first().text().trim();
                const loc = $(el).find('[class*="location"]').first().text().trim();
                let href = $(el).find('a').first().attr('href') || '';
                const link = href.startsWith('http') ? href : href ? `https://wellfound.com${href}` : '';
                const salary = $(el).find('[class*="salary"], [class*="compensation"]').first().text().trim() || 'Not Disclosed';

                if (title && link) {
                    jobs.push({
                        title, company: company || 'Startup via Wellfound',
                        location: loc || 'Remote / India', link,
                        portal: 'Wellfound',
                        salary, isStartup: true,
                        description: `${title} at ${company}. Startup role. ${loc}. ${salary}`,
                        status: 'New', dateFound: new Date().toISOString()
                    });
                }
            });
            database.addLog(`[Wellfound] Parsed startup listings`, 'success');
        } catch (err) {
            database.addLog(`[Wellfound] Error: ${err.message}`, 'error');
        }

        // ─── D. CUTSHORT — Startup tech & AI jobs ───
        try {
            database.addLog(`[Cutshort] Scraping for AI/ML startup roles...`, 'info');
            await page.goto('https://cutshort.io/jobs?q=machine+learning&experience=fresher', { waitUntil: 'domcontentloaded', timeout: 25000 });
            await delay(3000);
            const content = await page.content();
            const $ = cheerio.load(content);

            $('[class*="job-card"], [class*="JobCard"], .job-listing, article').each((i, el) => {
                const title = $(el).find('[class*="title"], h3, h4, a').first().text().trim();
                const company = $(el).find('[class*="company"], [class*="org"]').first().text().trim();
                const loc = $(el).find('[class*="location"]').first().text().trim();
                let href = $(el).find('a').first().attr('href') || '';
                const link = href.startsWith('http') ? href : href ? `https://cutshort.io${href}` : '';

                if (title && link && title.length > 5) {
                    jobs.push({
                        title, company: company || 'Startup via Cutshort',
                        location: loc || 'India / Remote', link,
                        portal: 'Cutshort',
                        salary: 'Not Disclosed', isStartup: true,
                        description: `${title} at ${company}. Startup role via Cutshort.`,
                        status: 'New', dateFound: new Date().toISOString()
                    });
                }
            });
            database.addLog(`[Cutshort] Parsed startup listings`, 'success');
        } catch (err) {
            database.addLog(`[Cutshort] Error: ${err.message}`, 'error');
        }

        // ─── E. INSTAHYRE — Curated tech jobs ───
        try {
            database.addLog(`[Instahyre] Scraping curated tech jobs...`, 'info');
            await page.goto('https://www.instahyre.com/search-jobs/', { waitUntil: 'domcontentloaded', timeout: 25000 });
            await delay(3000);
            const content = await page.content();
            const $ = cheerio.load(content);

            $('[class*="job-card"], .job-title-company, .opportunity-card').each((i, el) => {
                const title = $(el).find('.job-title, h4, [class*="title"]').first().text().trim();
                const company = $(el).find('.company-name, .job-company, [class*="company"]').first().text().trim();
                const loc = $(el).find('.location, .job-locations, [class*="location"]').first().text().trim();
                let href = $(el).find('a').first().attr('href') || '';
                const link = href.startsWith('http') ? href : href ? `https://www.instahyre.com${href}` : '';

                const matchesKeyword = keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(title));
                if (title && link && matchesKeyword) {
                    jobs.push({
                        title, company: company || 'Company via Instahyre',
                        location: loc || 'India / Remote', link,
                        portal: 'Instahyre', salary: 'Not Disclosed',
                        description: `${title} at ${company}. Curated tech role via Instahyre.`,
                        status: 'New', dateFound: new Date().toISOString()
                    });
                }
            });
            database.addLog(`[Instahyre] Parsed job listings`, 'success');
        } catch (err) {
            database.addLog(`[Instahyre] Error: ${err.message}`, 'error');
        }

        // ─── F. SHINE.COM — Indian job portal with fresher filter ───
        try {
            database.addLog(`[Shine] Scraping fresher tech jobs...`, 'info');
            await page.goto('https://www.shine.com/job-search/machine-learning-jobs?freshness=Today&experience=0.0-1.0', { waitUntil: 'domcontentloaded', timeout: 25000 });
            await delay(2000);
            const content = await page.content();
            const $ = cheerio.load(content);

            $('[class*="jobCard"], .job_listing_row, .jobsearch_row').each((i, el) => {
                const title = $(el).find('[class*="title"], h3, .job_title').first().text().trim();
                const company = $(el).find('[class*="company"], .company_name, .comp_name').first().text().trim();
                const loc = $(el).find('[class*="location"], .loc').first().text().trim();
                let href = $(el).find('a').first().attr('href') || '';
                const link = href.startsWith('http') ? href : href ? `https://www.shine.com${href}` : '';

                if (title && link && title.length > 5) {
                    jobs.push({
                        title, company: company || 'Company via Shine',
                        location: loc || 'India', link,
                        portal: 'Shine', salary: 'Not Disclosed',
                        description: `${title} at ${company}. Fresher role. ${loc}`,
                        status: 'New', dateFound: new Date().toISOString()
                    });
                }
            });
            database.addLog(`[Shine] Parsed fresher listings`, 'success');
        } catch (err) {
            database.addLog(`[Shine] Error: ${err.message}`, 'error');
        }

    } catch (err) {
        database.addLog(`[Puppeteer] Engine error: ${err.message}`, 'error');
    } finally {
        if (browser) await browser.close();
    }
    return jobs;
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCRAPE CYCLE — Orchestrates all 15+ portal scrapers
// ═══════════════════════════════════════════════════════════════
async function runScrapeCycle() {
    database.addLog('━━━ Starting hourly scrape cycle across 15+ portals ━━━', 'info');

    // AI/ML/Python/Data-focused keywords with fresher bias
    const keywords = [
        'python developer fresher',
        'machine learning fresher',
        'data analyst fresher',
        'artificial intelligence fresher',
        'AI ML engineer',
        'deep learning intern',
        'data science fresher',
        'NLP engineer',
    ];

    // Short keywords for portals that handle search differently
    const shortKeywords = ['python', 'machine learning', 'data analyst', 'AI ML'];

    let allScrapedJobs = [];

    // Phase 1: HTTP-based scrapers (parallel for speed)
    const httpPromises = [
        // LinkedIn with fresher filter
        ...shortKeywords.map(kw => scrapeLinkedIn(kw)),
        // Internshala (great for freshers)
        ...['python', 'machine-learning', 'data-analyst', 'artificial-intelligence'].map(kw => scrapeInternshala(kw)),
        // Unstop (Indian freshers portal)
        ...shortKeywords.map(kw => scrapeUnstop(kw)),
        // We Work Remotely (remote jobs)
        ...['python', 'machine learning', 'AI', 'data'].map(kw => scrapeWWR(kw)),
        // Remotive API (remote tech jobs)
        ...['python', 'machine learning', 'data analyst'].map(kw => scrapeRemotive(kw)),
        // Freshersworld (dedicated freshers portal)
        ...['python', 'machine-learning', 'data-analyst', 'ai-ml'].map(kw => scrapeFreshersworld(kw)),
        // TimesJobs (large Indian board)
        ...['python', 'machine learning', 'data analyst', 'AI'].map(kw => scrapeTimesJobs(kw)),
        // Glassdoor
        ...['python developer', 'machine learning'].map(kw => scrapeGlassdoor(kw)),
        // HackerEarth
        ...['machine learning', 'AI'].map(kw => scrapeHackerEarth(kw)),
    ];

    const httpResults = await Promise.all(httpPromises);
    httpResults.forEach(arr => allScrapedJobs.push(...arr));

    // Phase 2: Puppeteer-based scrapers (sequential to share browser)
    const headlessJobs = await scrapeHeadlessPortals(shortKeywords);
    allScrapedJobs.push(...headlessJobs);

    // Phase 3: Score, deduplicate, and save
    const profile = database.getProfile();
    const existingJobs = database.getJobs();
    const existingLinks = new Set(existingJobs.map(j => j.link));

    let newJobsCount = 0;

    allScrapedJobs.forEach(job => {
        if (job.link && !existingLinks.has(job.link)) {
            job.match_score = calculateScore(job, profile);
            existingJobs.unshift(job);
            existingLinks.add(job.link);
            newJobsCount++;
        }
    });

    // Cap at 2000 jobs max
    const trimmed = existingJobs.slice(0, 2000);
    database.saveJobs(trimmed);

    database.addLog(`━━━ Scrape cycle complete! Added ${newJobsCount} new jobs. Total: ${trimmed.length} ━━━`, 'success');
    return newJobsCount;
}

module.exports = {
    runScrapeCycle,
    scrapeLinkedIn, scrapeInternshala, scrapeUnstop, scrapeWWR,
    scrapeRemotive, scrapeFreshersworld, scrapeTimesJobs,
    scrapeGlassdoor, scrapeHackerEarth, scrapeHeadlessPortals
};
