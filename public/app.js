document.addEventListener('DOMContentLoaded', () => {
    // Current Active Tab
    let activeTab = 'jobs-tab';
    
    // Core Elements
    const tabButtons = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const triggerScrapeBtn = document.getElementById('trigger-scrape-btn');
    const jobsListContainer = document.getElementById('jobs-list-container');
    const profileForm = document.getElementById('profile-form');
    const logsContainer = document.getElementById('logs-container');
    
    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statUnapplied = document.getElementById('stat-unapplied');
    const statApplied = document.getElementById('stat-applied');
    const statAvgScore = document.getElementById('stat-avg-score');

    // Filters Elements
    const searchInput = document.getElementById('search-input');
    const portalFilter = document.getElementById('portal-filter');
    const scoreFilter = document.getElementById('score-filter');
    const statusFilter = document.getElementById('status-filter');

    // Cache variables
    let allJobs = [];

    // --- TAB NAVIGATION ---
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            activeTab = targetTab;

            if (targetTab === 'jobs-tab') fetchJobs();
            if (targetTab === 'profile-tab') fetchProfile();
            if (targetTab === 'logs-tab') fetchLogs();
        });
    });

    // --- GET DATA ---
    async function fetchStats() {
        try {
            const res = await fetch('/api/stats');
            const result = await res.json();
            if (result.success) {
                const stats = result.data;
                statTotal.innerText = stats.total;
                statApplied.innerText = stats.applied;
                statUnapplied.innerText = stats.unapplied;
                
                // Calculate average match score for high-quality jobs
                if (allJobs.length > 0) {
                    const totalScore = allJobs.reduce((sum, job) => sum + (job.match_score || 0), 0);
                    statAvgScore.innerText = `${Math.round(totalScore / allJobs.length)}%`;
                } else {
                    statAvgScore.innerText = '0%';
                }
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }

    async function fetchJobs() {
        try {
            const res = await fetch('/api/jobs');
            const result = await res.json();
            if (result.success) {
                allJobs = result.data;
                renderJobs();
                fetchStats();
            }
        } catch (err) {
            jobsListContainer.innerHTML = `<div class="loader" style="color:var(--error);">Failed to load jobs. Check if backend is running.</div>`;
        }
    }

    async function fetchProfile() {
        try {
            const res = await fetch('/api/profile');
            const result = await res.json();
            if (result.success && result.data) {
                const profile = result.data;
                document.getElementById('profile-name').value = profile.name || '';
                document.getElementById('profile-email').value = profile.email || '';
                document.getElementById('profile-phone').value = profile.phone || '';
                document.getElementById('profile-github').value = profile.github || '';
                document.getElementById('profile-linkedin').value = profile.linkedin || '';
                document.getElementById('profile-location').value = profile.location || '';
                document.getElementById('profile-skills').value = (profile.skills || []).join(', ');
                document.getElementById('profile-coverletter').value = profile.coverLetterTemplate || '';
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    }

    async function fetchLogs() {
        try {
            const res = await fetch('/api/logs');
            const result = await res.json();
            if (result.success) {
                logsContainer.innerHTML = '';
                if (result.data.length === 0) {
                    logsContainer.innerHTML = `<div class="log-line info">[System] No activity logs registered yet.</div>`;
                    return;
                }
                result.data.forEach(log => {
                    const line = document.createElement('div');
                    line.className = `log-line ${log.type}`;
                    const localTime = new Date(log.timestamp).toLocaleTimeString();
                    line.innerText = `[${localTime}] [${log.type.toUpperCase()}] ${log.message}`;
                    logsContainer.appendChild(line);
                });
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
    }

    // --- RENDER JOBS ---
    function renderJobs() {
        const query = searchInput.value.toLowerCase();
        const portalVal = portalFilter.value;
        const scoreVal = parseInt(scoreFilter.value);
        const statusVal = statusFilter.value;

        const filtered = allJobs.filter(job => {
            const matchesQuery = !query || 
                (job.title || '').toLowerCase().includes(query) || 
                (job.company || '').toLowerCase().includes(query) || 
                (job.description || '').toLowerCase().includes(query);
            
            const matchesPortal = !portalVal || job.portal === portalVal;
            const matchesScore = !scoreVal || (job.match_score || 0) >= scoreVal;
            const matchesStatus = !statusVal || 
                (statusVal === 'New' && (!job.status || job.status === 'New')) || 
                job.status === statusVal;

            return matchesQuery && matchesPortal && matchesScore && matchesStatus;
        });

        // Sort: Applied last, highest match score first
        filtered.sort((a, b) => {
            if (a.status === 'Applied' && b.status !== 'Applied') return 1;
            if (a.status !== 'Applied' && b.status === 'Applied') return -1;
            return (b.match_score || 0) - (a.match_score || 0);
        });

        if (filtered.length === 0) {
            jobsListContainer.innerHTML = `<div class="loader">No jobs matching your filter. Try adjusting filters or clicking "Scan Now".</div>`;
            return;
        }

        jobsListContainer.innerHTML = '';
        filtered.forEach(job => {
            const card = document.createElement('div');
            card.className = `job-card ${job.status === 'Applied' ? 'applied-fade' : ''}`;
            
            // Score Badge styling
            let scoreClass = 'score-low';
            if (job.match_score >= 80) scoreClass = 'score-high';
            else if (job.match_score >= 60) scoreClass = 'score-med';

            const portalSlug = job.portal.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
            const dateStr = new Date(job.dateFound).toLocaleDateString();

            card.innerHTML = `
                <div class="job-info">
                    <div class="job-title-row">
                        <h3>${escapeHTML(job.title)}</h3>
                        <span class="portal-badge badge-${portalSlug}">${job.portal}</span>
                        ${job.status === 'Applied' ? '<span class="portal-badge" style="background:rgba(16,185,129,0.1);color:#10b981;border:1px solid #10b981;">Applied</span>' : ''}
                    </div>
                    <div class="company-meta">
                        <span>🏢 ${escapeHTML(job.company)}</span>
                        <span>📍 ${escapeHTML(job.location)}</span>
                        <span>💰 ${escapeHTML(job.salary || 'Not Disclosed')}</span>
                        <span>📅 ${dateStr}</span>
                    </div>
                    <div class="job-desc">${escapeHTML(job.description || '').substring(0, 180)}...</div>
                </div>
                <div class="match-gauge">
                    <div class="score-badge ${scoreClass}">
                        <div>${job.match_score}%</div>
                        <div style="font-size:0.65rem;font-weight:400;margin-top:2px;">Match</div>
                    </div>
                    <div class="job-actions">
                        <a href="${job.link}" target="_blank" class="btn outline-btn">🔗 Link</a>
                        ${job.status !== 'Applied' ? `
                            <button class="btn primary-btn auto-apply-btn" data-link="${encodeURIComponent(job.link)}" data-title="${encodeURIComponent(job.title)}" data-company="${encodeURIComponent(job.company)}">⚡ Auto Fill</button>
                            <button class="btn outline-btn ignore-btn" data-link="${encodeURIComponent(job.link)}">❌ Ignore</button>
                        ` : ''}
                    </div>
                </div>
            `;
            jobsListContainer.appendChild(card);
        });

        // Bind application triggers
        document.querySelectorAll('.auto-apply-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const link = decodeURIComponent(btn.getAttribute('data-link'));
                const title = decodeURIComponent(btn.getAttribute('data-title'));
                const company = decodeURIComponent(btn.getAttribute('data-company'));
                btn.disabled = true;
                btn.innerText = 'Launching...';
                
                try {
                    const res = await fetch('/api/apply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ link, title, company })
                    });
                    const result = await res.json();
                    if (result.success) {
                        alert(`Successfully launched automated browser to apply for "${title}" at ${company}! Check the browser window that popped up.`);
                        fetchJobs();
                    } else {
                        alert(`Apply failed: ${result.message}`);
                        btn.disabled = false;
                        btn.innerText = '⚡ Auto Fill';
                    }
                } catch (err) {
                    alert(`Apply request error: ${err.message}`);
                    btn.disabled = false;
                    btn.innerText = '⚡ Auto Fill';
                }
            });
        });

        document.querySelectorAll('.ignore-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const link = decodeURIComponent(btn.getAttribute('data-link'));
                try {
                    const res = await fetch('/api/ignore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ link })
                    });
                    const result = await res.json();
                    if (result.success) {
                        fetchJobs();
                    }
                } catch (err) {
                    console.error('Ignore error:', err);
                }
            });
        });
    }

    // Helper to escape HTML characters
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // --- SAVE PROFILE ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = profileForm.querySelector('button[type="submit"]');
        saveBtn.innerText = 'Saving...';
        
        const profile = {
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            github: document.getElementById('profile-github').value,
            linkedin: document.getElementById('profile-linkedin').value,
            location: document.getElementById('profile-location').value,
            skills: document.getElementById('profile-skills').value.split(',').map(s => s.trim()).filter(Boolean),
            coverLetterTemplate: document.getElementById('profile-coverletter').value
        };

        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            const result = await res.json();
            if (result.success) {
                alert('Profile updated successfully!');
            } else {
                alert(`Error saving profile: ${result.message}`);
            }
        } catch (err) {
            alert(`Network error: ${err.message}`);
        } finally {
            saveBtn.innerText = 'Save Profile Settings';
            fetchJobs(); // Update match scores since skills changed
        }
    });

    // --- MANUAL SCAN TRIGGER ---
    triggerScrapeBtn.addEventListener('click', async () => {
        triggerScrapeBtn.disabled = true;
        triggerScrapeBtn.innerText = 'Scanning...';
        try {
            const res = await fetch('/api/scrape', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                alert('Job scraping task started in background. Refreshing in a few seconds...');
                setTimeout(() => {
                    fetchJobs();
                    triggerScrapeBtn.disabled = false;
                    triggerScrapeBtn.innerText = '🔄 Scan Now';
                }, 4000);
            }
        } catch (err) {
            alert(`Failed to trigger scan: ${err.message}`);
            triggerScrapeBtn.disabled = false;
            triggerScrapeBtn.innerText = '🔄 Scan Now';
        }
    });

    // --- AUTO POLL ---
    // Fetch logs and updates in background
    setInterval(() => {
        if (activeTab === 'logs-tab') fetchLogs();
        if (activeTab === 'jobs-tab') fetchStats();
    }, 5000);

    // Filter Listeners
    [searchInput, portalFilter, scoreFilter, statusFilter].forEach(el => {
        el.addEventListener('input', renderJobs);
    });

    // Initial Load
    fetchJobs();
    fetchProfile();
});
