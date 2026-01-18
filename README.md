# 🔮 FocusFlow - AI Study Sidekick

FocusFlow is a high-end, gamified productivity app designed for students and teens. It helps you crush procrastination by breaking down big, scary tasks into tiny, manageable "Missions" using Google Gemini AI.

## 🚀 Deployment Checklist (Vercel)

Deploying this app takes less than 2 minutes. Follow these steps exactly:

### 1. Prepare your GitHub
- Create a new repository on [GitHub.com](https://github.com) named `FocusFlow`.
- Upload all files from this project to that repository.

### 2. Connect to Vercel
- Sign in to [Vercel.com](https://vercel.com) using your GitHub account.
- Click **"Add New"** then **"Project"**.
- Find your `FocusFlow` repository and click **"Import"**.

### 3. THE MOST IMPORTANT STEP (API Key)
The app **will not work** without your Gemini API Key. 
- In the Vercel "Configure Project" screen, look for the **Environment Variables** section.
- Add a new variable:
  - **Key**: `API_KEY`
  - **Value**: (Paste your Gemini API Key here)
- Get a free key at [aistudio.google.com](https://aistudio.google.com).

### 4. Deploy!
- Click **"Deploy"**.
- Vercel will give you a link like `focusflow.vercel.app`. You are now live!

## 🌐 Custom Domain Troubleshooting (FocusFlow.com)

If you see the **"Verification Needed"** or **"Invalid Configuration"** error in Vercel for your domain (like in your screenshot), you need to update your DNS settings at your domain registrar (e.g., GoDaddy, Namecheap):

### Fix 1: Ownership Verification (The TXT Record)
Vercel needs to know you own the domain. 
1. Add a new **TXT** record.
2. **Host/Name**: `_vercel`
3. **Value**: Copy the long code from your Vercel dashboard (e.g., `vc-domain-verify=focusflow.com,942c8512...`).

### Fix 2: Pointing to Vercel (The A Record)
Your current A record is pointing to the wrong IP (`216.198.79.1`).
1. Find your existing **A** record for `@`.
2. Change the **Value/IP Address** to: `76.76.21.21`.
3. Save and wait up to 10-30 minutes for the changes to spread.

## ✨ Pro Tips for Students
- **Dark Mode**: The app automatically detects your system settings, but you can toggle it in the Settings tab.
- **Supabase**: Your data (Posts, Stories, Messages) is synced to a real database. You can manage this in the "Persistence Lab" section of the code.
- **Mobile First**: This app is designed to look amazing on your phone. Add the Vercel link to your home screen for the best experience.

## 🛠️ Technology Stack
- **Frontend**: React + Tailwind CSS (2025 Modern Mobile Design)
- **AI**: Google Gemini 3 (Flash & Pro)
- **Backend**: Supabase (Auth & Realtime Database)

---
*Built with ❤️ for the next generation of high-performers.*