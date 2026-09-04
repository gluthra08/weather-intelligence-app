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

## 🚀 Google AI Studio to GitHub & Cloudflare Deployment Guide

This project leverage a hybrid automated-manual deployment pipeline:

1. Automated Code & Version Control Sync (AI Studio to GitHub):
   - Rather than executing manual command-line Git instructions, the repository was initialized directly within Google AI Studio using its native "Publish to GitHub" feature.
   - Google AI Studio automatically provisioned the public repository on GitHub, generated the required build files (package.json, vite.config.ts), and pushed the initial production-ready React codebase in a single click

2. Manual Global Edge Hosting Connection (GitHub to Cloudflare Pages):
   - Logged into Cloudflare Pages manually and authorized connection to the GitHub account.
   - Selected the newly created 'weather-intelligence-app' repository.
   - Configured the compilation rules using the Vite framework preset, setting the Build Command to 'npm run build' and the Output Directory to 'dist'.
   - Triggered the production build and customized the global routing subdomain to 'gl.workers.dev' once the deployment was live.
   - Any subsequent updates pushed via Google AI Studio's sync button will automatically trigger Cloudflare to rebuild and deploy the site in under 60 seconds (CI/CD)
.
