/**
 * AI Match Relevance Scorer
 * Scores each job 0-100 based on how well it fits a B.Tech AIML 2026 fresher profile.
 * Priorities: AI/ML roles > Startups > Python/Data > Remote > Other
 */

function calculateScore(job, profile) {
    let score = 40; // Base score
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    const combined = `${title} ${desc} ${company}`;

    // ══════════════════════════════════════════════════
    // 1. EXPERIENCE LEVEL ALIGNMENT (Critical for freshers)
    // ══════════════════════════════════════════════════
    const fresherSignals = ['fresher', 'intern', 'trainee', 'junior', 'jr', 'entry level',
        'entry-level', 'graduate', 'graduate trainee', '0-1', '0 - 1', '0-2', 'campus',
        'associate', 'apprentice', 'starter', 'beginner', 'new grad'];
    const seniorSignals = ['senior', 'sr.', 'sr ', 'lead', 'principal', 'architect',
        'manager', 'director', 'vp', 'head of', 'staff', 'distinguished',
        '5+', '7+', '8+', '10+', '5-10', '3-5', '4-6'];

    const isFresher = fresherSignals.some(s => combined.includes(s));
    const isSenior = seniorSignals.some(s => title.includes(s));

    if (isFresher) score += 25;   // Big boost for fresher roles
    if (isSenior) score -= 45;    // Heavy penalty for senior roles

    // Parse explicit experience requirements like "2-4 years"
    const expMatch = desc.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)/i);
    if (expMatch) {
        const minYrs = parseInt(expMatch[1]);
        if (minYrs === 0) score += 15;
        else if (minYrs === 1) score += 5;
        else if (minYrs >= 3) score -= (minYrs * 8);
    }

    // ══════════════════════════════════════════════════
    // 2. AI/ML DOMAIN MATCH (Highest priority)
    // ══════════════════════════════════════════════════
    const aimlKeywords = {
        core_ai: { keywords: ['artificial intelligence', 'ai ', 'ai/', 'ai-', 'gen ai', 'generative ai', 'agentic', 'llm', 'large language model', 'prompt engineer', 'ai engineer'], weight: 12 },
        core_ml: { keywords: ['machine learning', 'ml ', 'ml/', 'deep learning', 'neural network', 'computer vision', 'nlp', 'natural language processing', 'reinforcement learning', 'model training'], weight: 12 },
        python: { keywords: ['python', 'django', 'flask', 'fastapi', 'jupyter', 'pandas', 'numpy', 'scipy'], weight: 8 },
        data: { keywords: ['data analyst', 'data analysis', 'data science', 'data scientist', 'data engineer', 'analytics', 'business analyst', 'bi analyst', 'tableau', 'power bi', 'sql', 'etl'], weight: 8 },
        frameworks: { keywords: ['tensorflow', 'pytorch', 'keras', 'scikit', 'sklearn', 'opencv', 'huggingface', 'langchain', 'transformers', 'xgboost'], weight: 6 },
    };

    let categoryMatches = 0;
    Object.values(aimlKeywords).forEach(cat => {
        const matched = cat.keywords.some(kw => combined.includes(kw));
        if (matched) {
            score += cat.weight;
            categoryMatches++;
        }
    });

    // Bonus for matching multiple AI/ML categories
    if (categoryMatches >= 3) score += 10;

    // ══════════════════════════════════════════════════
    // 3. SKILLS MATCH FROM RESUME
    // ══════════════════════════════════════════════════
    const skills = profile.skills || [];
    let skillMatches = 0;
    skills.forEach(skill => {
        if (combined.includes(skill.toLowerCase())) {
            score += 3;
            skillMatches++;
        }
    });
    if (skillMatches >= 5) score += 8; // Bonus for many matched skills

    // ══════════════════════════════════════════════════
    // 4. STARTUP & COMPANY TYPE BONUS
    // ══════════════════════════════════════════════════
    const startupSignals = ['startup', 'early stage', 'seed', 'series a', 'series b',
        'funded', 'fast-growing', 'stealth', 'y combinator', 'yc', 'techstars',
        'incubator', 'accelerator'];
    const isStartup = startupSignals.some(s => combined.includes(s)) || job.isStartup;
    if (isStartup) score += 10; // Startup bonus

    // Portals known for startup jobs get a small boost
    const startupPortals = ['Wellfound', 'Cutshort', 'Instahyre'];
    if (startupPortals.includes(job.portal)) score += 5;

    // ══════════════════════════════════════════════════
    // 5. REMOTE & LOCATION PREFERENCE
    // ══════════════════════════════════════════════════
    const loc = (job.location || '').toLowerCase();
    if (loc.includes('remote') || loc.includes('work from home') || loc.includes('wfh')) {
        score += 5;
    }
    // India-based locations get a small boost (user is India-based)
    if (loc.includes('india') || loc.includes('bangalore') || loc.includes('mumbai') ||
        loc.includes('pune') || loc.includes('hyderabad') || loc.includes('nagpur') ||
        loc.includes('delhi') || loc.includes('chennai') || loc.includes('noida') ||
        loc.includes('gurgaon') || loc.includes('gurugram')) {
        score += 3;
    }

    // ══════════════════════════════════════════════════
    // 6. NEGATIVE SIGNALS (reduce noise)
    // ══════════════════════════════════════════════════
    const noiseKeywords = ['sales executive', 'marketing manager', 'accountant',
        'civil engineer', 'mechanical engineer', 'lawyer', 'doctor',
        'nursing', 'real estate', 'insurance', 'banking operations',
        'telecaller', 'bpo', 'customer support', 'delivery'];
    const isNoise = noiseKeywords.some(nk => title.includes(nk));
    if (isNoise) score -= 30;

    // ══════════════════════════════════════════════════
    // Clamp to 0-100 range
    // ══════════════════════════════════════════════════
    return Math.min(100, Math.max(0, Math.round(score)));
}

module.exports = { calculateScore };
