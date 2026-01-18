
# 🔮 JustStart - AI Study Sidekick

JustStart is a high-end, gamified productivity app designed for students and teens. It helps you crush procrastination by breaking down big, scary tasks into tiny, manageable "Missions" using Google Gemini AI.

## 🚀 Deployment Checklist (Vercel)

Deploying this app takes less than 2 minutes. Follow these steps exactly:

### 1. Prepare your GitHub
- Create a new repository on [GitHub.com](https://github.com) named `JustStart`.
- Upload all files from this project to that repository.

### 2. Connect to Vercel
- Sign in to [Vercel.com](https://vercel.com) using your GitHub account.
- Click **"Add New"** then **"Project"**.
- Find your `JustStart` repository and click **"Import"**.

### 3. THE MOST IMPORTANT STEP (API Key)
The app **will not work** without your Gemini API Key. 
- In the Vercel "Configure Project" screen, look for the **Environment Variables** section.
- Add a new variable:
  - **Key**: `API_KEY`
  - **Value**: (Paste your Gemini API Key here)
- Get a free key at [aistudio.google.com](https://aistudio.google.com).

### 4. Deploy!
- Click **"Deploy"**.
- Vercel will give you a link like `just-start.vercel.app`. You are now live!

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
