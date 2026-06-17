const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure database files exist
function initDB() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(JOBS_FILE)) {
        fs.writeFileSync(JOBS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(PROFILE_FILE)) {
        // Seed default profile with Devanshu's resume data
        const defaultProfile = {
            name: "Devanshu Dhoble",
            email: "devanshudhoble32@gmail.com",
            phone: "9356983701",
            github: "https://github.com/devanshudhoble",
            linkedin: "https://www.linkedin.com/in/devanshudhoble", // Placeholder link
            location: "Nagpur, Maharashtra",
            skills: [
                "Python", "JavaScript", "C", "PHP", 
                "HTML5/CSS3", "React.js (Basic)", "REST APIs", "SQL", "Flask",
                "TensorFlow", "PyTorch", "NumPy", "Pandas", "OpenCV", "ADK", "jQuery"
            ],
            projects: [
                {
                    title: "SYNFAKE-BUSTER - AI CONTENT DETECTOR",
                    description: "Web-based tool to detect whether image, video, audio, text, or document is real or AI-generated. High accuracy."
                },
                {
                    title: "Annual Departmental Report Portal for Institute",
                    description: "Streamlined storage and retrieval of annual departmental records using PHP-MySQL integration."
                }
            ],
            experience: [
                {
                    role: "Project Intern - AIML",
                    company: "Sasken Technologies Ltd",
                    location: "Bangalore",
                    duration: "Dec 2025 - April 2026",
                    description: "Worked on building production grade multi-agent AI tutoring platforms. Developed Intent detection and dynamic routing. Engineered tutors in C and Python."
                },
                {
                    role: "Machine Learning Intern",
                    company: "Uphill Technologies Pvt. Ltd",
                    location: "Nagpur",
                    duration: "May 2025 - June 2025",
                    description: "Gained hands-on experience in ML projects under expert mentorship. Worked on a Retail Price Prediction project using historical sales and product data."
                }
            ],
            education: {
                college: "S. B. Jain Institute of Technology, Management & Research, Nagpur",
                degree: "Bachelor of Technology in AI-ML",
                duration: "Nov 2022 - May 2026",
                cgpa: "8.03"
            },
            coverLetterTemplate: `Dear Hiring Team,\n\nI am writing to express my interest in the AI/ML / Python / Data Analyst role at your company. As a B.Tech student specializing in AI-ML with internship experience building production-grade multi-agent AI platforms at Sasken Technologies, and ML projects at Uphill Technologies, I am eager to apply my skills in Python, TensorFlow, PyTorch, and Web Development to your team.\n\nThank you for considering my application.\n\nBest regards,\nDevanshu Dhoble\n9356983701\ndevanshudhoble32@gmail.com\nhttps://github.com/devanshudhoble`
        };
        fs.writeFileSync(PROFILE_FILE, JSON.stringify(defaultProfile, null, 2));
    }
    if (!fs.existsSync(LOGS_FILE)) {
        fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
    }
}

// Read JSON files synchronously or safely helper
function readJSON(file) {
    try {
        if (!fs.existsSync(file)) return [];
        const content = fs.readFileSync(file, 'utf8');
        return JSON.parse(content || '[]');
    } catch (err) {
        console.error(`Error reading ${file}:`, err);
        return [];
    }
}

function writeJSON(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`Error writing ${file}:`, err);
        return false;
    }
}

initDB();

module.exports = {
    getJobs: () => readJSON(JOBS_FILE),
    
    saveJobs: (jobs) => writeJSON(JOBS_FILE, jobs),
    
    getProfile: () => {
        const p = readJSON(PROFILE_FILE);
        return Array.isArray(p) ? p[0] : p;
    },
    
    saveProfile: (profile) => writeJSON(PROFILE_FILE, profile),
    
    getLogs: () => readJSON(LOGS_FILE),
    
    addLog: (message, type = 'info') => {
        const logs = readJSON(LOGS_FILE);
        logs.unshift({
            timestamp: new Date().toISOString(),
            message,
            type
        });
        // Keep last 200 logs
        if (logs.length > 200) logs.pop();
        writeJSON(LOGS_FILE, logs);
    },
    
    getStats: () => {
        const jobs = readJSON(JOBS_FILE);
        const stats = {
            total: jobs.length,
            applied: jobs.filter(j => j.status === 'Applied').length,
            shortlisted: jobs.filter(j => j.status === 'Shortlisted').length,
            ignored: jobs.filter(j => j.status === 'Ignored').length,
            unapplied: jobs.filter(j => !j.status || j.status === 'Found' || j.status === 'New').length,
            portals: {}
        };
        
        jobs.forEach(j => {
            stats.portals[j.portal] = (stats.portals[j.portal] || 0) + 1;
        });
        
        return stats;
    }
};
