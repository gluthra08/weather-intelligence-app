# 🌤️ Weather Intelligence App

A modern, highly responsive single-page web application designed to translate real-time meteorological metrics into actionable business and travel planning insights. This application was prototyped using "vibe coding" methodologies in Google AI Studio App Build, synchronized directly with GitHub, and deployed on Cloudflare Pages' global serverless edge network.

## 🚀 Live Demo
🔗 **Live Application URL:** [https://weather-intelligence-app.gluthra.workers.dev/]

## 🛡️ GRC & Security Compliance
In strict alignment with corporate data security and governance protocols:
- **Zero Key Exposure:** Utilizes public, open-access Open-Meteo APIs, completely eliminating the need for private developer API keys or secret tokens.
- **No Data Privacy Concerns:** Processes all geocoding and forecast queries client-side in-memory. Zero storage, tracking, or personal identifiable information (PII) collection.

## ✨ Core Features
- **Smart Autocomplete Search:** Dynamic, fuzzy-matching city search that displays matches as you type to prevent spelling errors and empty state searches.
- **Current Weather Intelligence:** High-visibility display showing temperature (°C), wind speed (km/h), and representative weather icons.
- **7-Day Outlook Grid:** A fluid, responsive horizontal forecast grid tracking max/min temperatures and expected precipitation.
- **Deterministic Planning Rules:** Automated, rule-based advisory triggers (e.g., High Heat and Rain warnings) to guide user travel safety.
- **Resilient Error Handling:** A graceful catch-all system that displays polite, user-friendly feedback when non-existent locations are searched.

## 🛠️ Tech Stack
- **Framework:** React 18+ (Vite Bundler)
- **Styling:** Tailwind CSS (Fluid grid system, fully responsive)
- **Icons:** Lucide React
- **Deployment Platform:** Cloudflare Pages CI/CD

🚀 Google AI Studio to GitHub & Cloudflare Deployment Guide
📦 Phase 1: Direct Version Control Sync (Google AI Studio to GitHub)
Initialize Synchronization: Open Settings in Google AI Studio and select the GitHub tab
.
Account Authentication: Authenticate and connect your GitHub account
. Note: It is highly recommended to use matching email addresses for both accounts to avoid authentication conflicts
.
Repository Provisioning: Provide your project details (name, private/public visibility, and description) and click Create GitHub repository
. Google AI Studio will automatically generate your remote repository and configure your files
.
Push Live: Click Stage and commit all changes
. The background Antigravity Agent automatically packages the files, drafts an AI-generated commit message detailing the changes, and pushes the initial production-ready codebase to GitHub
.
🌐 Phase 2: Live Global Hosting (GitHub to Cloudflare Pages/Workers)
Initiate Cloudflare Build: Log in to pages.cloudflare.com and click Create Application
.
Authorize Repository Access: Click Continue with GitHub to connect your account and choose your specific app repository (e.g., weather-intelligence-app)
.
Configure Project Settings: Review the auto-populated build configs
. Note: Ensure your Cloudflare project name is completely lowercase, as uppercase characters are restricted
.
Compile and Deploy: Click Deploy
. Cloudflare compiles your code and securely hosts it on their global edge network under a free, default sub-domain ending in .workers.dev (or .pages.dev)
.
Continuous Deployment (CI/CD): Since your pipeline is active, any subsequent code modifications you stage and commit from your Google AI Studio workspace will automatically push to GitHub and immediately trigger Cloudflare to rebuild and redeploy the live site
.
