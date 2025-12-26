<div align="center">

</div>

# مِحكاة - Mahkāh

تطبيق ذكي لاستنطاق حكايات النباتات في مهرجان الحمضيات بالحريق  
An AI-powered storytelling app for the Al-Hariq Citrus Festival


---

## 🚀 Deploy to Netlify

### Prerequisites
- Node.js (v18 or higher)
- GitHub account
- Netlify account
- Google AI Studio API Key

### Steps

#### 1. Get Your Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

#### 2. Deploy to Netlify

**Option A: Git Deploy (Recommended)**

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to [Netlify](https://app.netlify.com)

3. Click **"Add new site"** → **"Import an existing project"**

4. Select **GitHub** and choose your repository

5. Netlify will auto-detect the settings from `netlify.toml` ✅

6. Click **Deploy**

**Option B: Manual Deploy**

1. Build the project locally:
   ```bash
   npm install
   npm run build
   ```

2. Go to [Netlify](https://app.netlify.com)

3. Drag and drop the `dist` folder

#### 3. Add Environment Variables

⚠️ **IMPORTANT:** After deployment, add your API key:

1. Go to your site in Netlify
2. Navigate to: **Site Settings** → **Environment Variables**
3. Click **"Add a variable"**
4. Add:
   - **Key**: `API_KEY`
   - **Value**: `[Your Google AI Studio API Key]`
5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy**

---

## 💻 Run Locally

### For Development (without Netlify Functions)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```
   API_KEY=your_google_ai_studio_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### To Test Netlify Functions Locally

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Create `.env` file:
   ```
   API_KEY=your_google_ai_studio_key_here
   ```

3. Run with Netlify Dev:
   ```bash
   netlify dev
   ```

---

## 📁 Project Structure

```
مِحكاة---mahkāh/
├── netlify/
│   └── functions/
│       └── story.ts          # Netlify Function (Server-side AI calls)
├── services/
│   └── geminiService.ts      # Frontend service (calls Netlify Function)
├── App.tsx                   # Main React app
├── types.ts                  # TypeScript types
├── constants.tsx             # App constants
├── netlify.toml              # Netlify configuration
├── package.json
└── README.md
```

---

## 🔒 Security Notes

- ✅ API Key is stored securely in Netlify Environment Variables
- ✅ API calls are made server-side via Netlify Functions
- ✅ No API key exposure in the browser
- ❌ **NEVER** commit `.env` or `.env.local` files to Git

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Netlify Functions (Serverless)
- **AI**: Google Gemini 2.0 Flash
- **Styling**: Tailwind CSS (inline)
- **Hosting**: Netlify

---

## 📝 License

Private project for Al-Hariq Citrus Festival

---

## 🤝 Support

For issues or questions, contact the development team.
