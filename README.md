<div align="center">

# 🎯 Job Hunter Agent

### 🤖 AI/ML Fresher Job Hunter & Auto-Apply Agent

*An intelligent, fully-automated job discovery and application agent that scrapes **15+ job portals** every hour, scores listings with AI relevance matching, and auto-applies via browser automation — all from a stunning dark-mode dashboard.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-21.x-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)](https://pptr.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[![Stars](https://img.shields.io/github/stars/devanshudhoble/job-hunter?style=social)](https://github.com/devanshudhoble/job-hunter/stargazers)
[![Forks](https://img.shields.io/github/forks/devanshudhoble/job-hunter?style=social)](https://github.com/devanshudhoble/job-hunter/network/members)
[![Issues](https://img.shields.io/github/issues/devanshudhoble/job-hunter?style=flat-square&color=red)](https://github.com/devanshudhoble/job-hunter/issues)
[![Last Commit](https://img.shields.io/github/last-commit/devanshudhoble/job-hunter?style=flat-square&color=blue)](https://github.com/devanshudhoble/job-hunter/commits/main)

<br/>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="divider" width="100%"/>

</div>

<br/>

## 📑 Table of Contents

- [✨ Features](#-features)
- [🖥️ Screenshots](#️-screenshots)
- [🌐 Supported Job Portals](#-supported-job-portals)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Configuration](#️-configuration)
- [📂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [👤 Author](#-author)

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔍 Smart Job Discovery
- ✅ Scrapes **15+ job portals** simultaneously
- ✅ Hourly **cron-based** automated scanning
- ✅ Intelligent **deduplication** — no duplicate listings
- ✅ Supports APIs, RSS feeds, HTML parsing & Puppeteer

</td>
<td width="50%">

### 🧠 AI Match Scoring
- ✅ Relevance score **0–100** for every listing
- ✅ Prioritizes **fresher / entry-level** roles
- ✅ Weighted matching for **AI, ML, Python, Data Analysis**
- ✅ Bonus scoring for **startup companies**

</td>
</tr>
<tr>
<td width="50%">

### 🤖 Auto-Apply Engine
- ✅ **Puppeteer** headful browser automation
- ✅ Opens application pages & fills form fields
- ✅ Pauses for **user review** before final submission
- ✅ Tracks application status per job

</td>
<td width="50%">

### 🎨 Premium Dashboard
- ✅ **Glassmorphism** dark-mode UI at `localhost:3080`
- ✅ Real-time job feed with **filters** (portal, score, status)
- ✅ Built-in **Profile Manager** pre-filled from resume
- ✅ **System Logs** terminal view for debugging

</td>
</tr>
</table>

<br/>

## 🖥️ Screenshots

> 🚧 *Screenshots coming soon! Run the project locally to see the dashboard in action.*

<div align="center">

| Dashboard | Job Feed | Profile Manager |
|:---------:|:--------:|:---------------:|
| ![Dashboard](https://via.placeholder.com/300x180/1a1a2e/e94560?text=Dashboard) | ![Job Feed](https://via.placeholder.com/300x180/1a1a2e/00d2ff?text=Job+Feed) | ![Profile](https://via.placeholder.com/300x180/1a1a2e/00ff88?text=Profile) |

</div>

<br/>

## 🌐 Supported Job Portals

> Scraping **15 platforms** across India & remote job markets — with more being added!

| # | Portal | Method | Focus Area | Status |
|:-:|--------|--------|------------|:------:|
| 1 | 💼 **LinkedIn** | Guest API | All industries | 🟢 Active |
| 2 | 🔍 **Indeed India** | Puppeteer | All industries | 🟢 Active |
| 3 | 📄 **Naukri.com** | Puppeteer | Indian job market | 🟢 Active |
| 4 | 🎓 **Internshala** | HTML Parser | Internships & freshers | 🟢 Active |
| 5 | 🏆 **Unstop** | API | Competitions & jobs | 🟢 Active |
| 6 | 🚀 **Wellfound / AngelList** | Puppeteer | Startup jobs | 🟢 Active |
| 7 | ✂️ **Cutshort** | Puppeteer | Startup & tech roles | 🟢 Active |
| 8 | 📬 **Instahyre** | Puppeteer | Curated tech jobs | 🟢 Active |
| 9 | 🌍 **We Work Remotely** | RSS Feed | Remote-only roles | 🟢 Active |
| 10 | 🏠 **Remote.co** | HTML Parser | Remote-only roles | 🟢 Active |
| 11 | 📡 **Remotive** | API / RSS | Remote tech jobs | 🟢 Active |
| 12 | 💻 **HackerEarth Jobs** | HTML Parser | Developer roles | 🟢 Active |
| 13 | 🌱 **Freshersworld** | HTML Parser | Fresher-only roles | 🟢 Active |
| 14 | 📰 **TimesJobs** | HTML Parser | Indian job market | 🟢 Active |
| 15 | ☀️ **Shine.com** | HTML Parser | Indian job market | 🟢 Active |

<br/>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JOB HUNTER AGENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐    ┌──────────────────┐    ┌───────────────────┐    │
│   │  Client   │◄──►│   Express API    │◄──►│   JSON Storage    │    │
│   │ Dashboard │    │   (Port 3080)    │    │   (File-based)    │    │
│   │ HTML/CSS/ │    │                  │    │                   │    │
│   │    JS     │    │  ┌────────────┐  │    │  jobs.json        │    │
│   └──────────┘    │  │  Routes &   │  │    │  profile.json     │    │
│                    │  │  Controllers│  │    │  logs.json        │    │
│                    │  └────────────┘  │    └───────────────────┘    │
│                    └────────┬─────────┘                             │
│                             │                                       │
│              ┌──────────────┼──────────────┐                       │
│              ▼              ▼              ▼                        │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│   │  node-cron   │ │  AI Scoring  │ │  Auto-Apply  │              │
│   │  Scheduler   │ │    Engine    │ │   Engine     │              │
│   │  (Hourly)    │ │  (0 - 100)   │ │ (Puppeteer)  │              │
│   └──────┬───────┘ └──────────────┘ └──────┬───────┘              │
│          │                                  │                       │
│          ▼                                  ▼                       │
│   ┌──────────────────────────────┐  ┌──────────────┐              │
│   │      Scraping Layer          │  │   Headful     │              │
│   │                              │  │   Browser     │              │
│   │  ┌────────┐  ┌───────────┐  │  │  (Chromium)   │              │
│   │  │ Axios  │  │ Puppeteer │  │  └──────────────┘              │
│   │  │Cheerio │  │ (headless)│  │                                 │
│   │  └───┬────┘  └─────┬─────┘  │                                 │
│   │      │             │        │                                  │
│   │      ▼             ▼        │                                  │
│   │  ┌─────────────────────┐    │                                  │
│   │  │   15+ Job Portals   │    │                                  │
│   │  │  LinkedIn · Indeed  │    │                                  │
│   │  │  Naukri · Unstop    │    │                                  │
│   │  │  Internshala · WWR  │    │                                  │
│   │  │   ... and more      │    │                                  │
│   │  └─────────────────────┘    │                                  │
│   └──────────────────────────────┘                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

<br/>

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Backend** | ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white) | REST API server on port 3080 |
| **Scraping** | ![Axios](https://img.shields.io/badge/-Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) ![Cheerio](https://img.shields.io/badge/-Cheerio-E88C1F?style=flat-square) ![Puppeteer](https://img.shields.io/badge/-Puppeteer-40B5A4?style=flat-square&logo=puppeteer&logoColor=white) | HTTP requests, HTML parsing, browser automation |
| **Scheduling** | ![node-cron](https://img.shields.io/badge/-node--cron-6C3483?style=flat-square) | Hourly automated job discovery |
| **Storage** | ![JSON](https://img.shields.io/badge/-JSON_Files-292929?style=flat-square&logo=json&logoColor=white) | Zero-dependency file-based persistence |
| **Frontend** | ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Glassmorphism dark-mode dashboard |
| **Auto-Apply** | ![Puppeteer](https://img.shields.io/badge/-Puppeteer-40B5A4?style=flat-square&logo=puppeteer&logoColor=white) | Headful browser for form filling |

<br/>

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x — [Download here](https://nodejs.org/)
- **npm** ≥ 9.x (bundled with Node.js)
- **Google Chrome** or **Chromium** (for Puppeteer auto-apply)

### Installation

```bash
# 1️⃣  Clone the repository
git clone https://github.com/devanshudhoble/job-hunter.git

# 2️⃣  Navigate to the project directory
cd job-hunter

# 3️⃣  Install dependencies
npm install

# 4️⃣  Start the server
node server.js
```

### 🎉 You're live!

Open your browser and navigate to:

```
🌐  http://localhost:3080
```

> **💡 Tip:** The first scraping cycle begins immediately on launch. Subsequent scans run automatically every hour via `node-cron`.

<br/>

## ⚙️ Configuration

| Setting | Location | Description |
|:--------|:---------|:------------|
| **Port** | `server.js` | Dashboard port (default: `3080`) |
| **Cron Schedule** | `server.js` | Scraping frequency (default: every hour) |
| **Target Keywords** | Scoring engine | `AI`, `ML`, `Python`, `Data Analysis`, etc. |
| **Resume / Profile** | Dashboard → Profile Manager | Pre-fill your details for auto-apply |

<br/>

## 📂 Project Structure

```
job-hunter/
├── 📄 server.js              # Express server + cron scheduler
├── 📁 public/                 # Frontend dashboard
│   ├── index.html             # Main dashboard page
│   ├── style.css              # Glassmorphism dark theme
│   └── script.js              # Client-side logic & filters
├── 📁 scrapers/               # Portal-specific scraper modules
│   ├── linkedin.js
│   ├── indeed.js
│   ├── naukri.js
│   ├── internshala.js
│   ├── unstop.js
│   ├── wellfound.js
│   ├── cutshort.js
│   ├── instahyre.js
│   ├── weworkremotely.js
│   ├── remoteco.js
│   ├── remotive.js
│   ├── hackerearth.js
│   ├── freshersworld.js
│   ├── timesjobs.js
│   └── shine.js
├── 📁 data/                   # JSON file-based storage
│   ├── jobs.json
│   ├── profile.json
│   └── logs.json
├── 📁 utils/                  # Helper modules
│   ├── scorer.js              # AI match scoring engine
│   ├── dedup.js               # Deduplication logic
│   └── autoapply.js           # Puppeteer auto-apply engine
├── 📄 package.json
├── 📄 .gitignore
├── 📄 LICENSE
└── 📄 README.md
```

<br/>

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**! 🙌

### How to Contribute

1. **Fork** the repository
2. **Create** your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### 💡 Ideas for Contributions

| Area | Idea |
|:-----|:-----|
| 🌐 New Portals | Add scrapers for Glassdoor, Monster, SimplyHired |
| 🧠 AI Scoring | Integrate OpenAI or Gemini for smarter matching |
| 📧 Notifications | Email / Telegram alerts for high-score jobs |
| 📊 Analytics | Charts for jobs discovered over time |
| 🐳 Docker | Containerize the application |

<br/>

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

```
MIT License

Copyright (c) 2026 Devanshu Dhoble

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

<br/>

## 👤 Author

<div align="center">

**Devanshu Dhoble**

🎓 B.Tech AI-ML (2026) · S.B. Jain Institute of Technology, Nagpur

[![GitHub](https://img.shields.io/badge/GitHub-devanshudhoble-181717?style=for-the-badge&logo=github)](https://github.com/devanshudhoble)

</div>

---

<div align="center">

**⭐ If this project helped you, consider giving it a star!**

<br/>

Made with ❤️ and ☕ by [Devanshu Dhoble](https://github.com/devanshudhoble)

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="divider" width="100%"/>

<sub>🤖 Job hunting, automated. Focus on preparing — let the agent handle the hunt.</sub>

</div>
