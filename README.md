
# 🔮 FocusFlow - AI Study Coach

FocusFlow is a minimalist, gamified productivity app designed for students and teens. It helps you crush procrastination by breaking down big, scary tasks into tiny, manageable "Missions" using the power of Google Gemini AI.

## ✨ Key Features

- **🎯 AI Mission Builder**: Turn any goal into a step-by-step plan.
- **🦉 Starty Coach**: A real-time AI tutor that can search the web and talk back to you.
- **🎮 Gamified XP**: Earn points, level up, and maintain streaks.
- **📚 Skill Quizzes**: Learn life skills and tech basics through interactive units.
- **🧪 Database Lab**: A built-in SQL environment to see your data sync in real-time.

## 🛠️ Technology Stack

- **Frontend**: React (Native ESM) + Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
- **Backend**: Supabase (Authentication & Database)

## 🚀 How to Make it Live (Deployment)

Since this app uses modern ESM modules, it's very easy to host:

1. **Upload to GitHub**: Put all these files into a GitHub repository.
2. **Connect to Vercel**: 
   - Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
   - Click **Add New** > **Project**.
   - Import your `FocusFlow` repo.
3. **Set your API Key**:
   - During setup, find the **Environment Variables** section.
   - Add a key named `API_KEY` and paste your Gemini API Key as the value.
4. **Deploy**: Click Deploy! Your app will be live on a custom URL (e.g., `focus-flow.vercel.app`).

---
*Created with ❤️ for FocusFlow users.*
