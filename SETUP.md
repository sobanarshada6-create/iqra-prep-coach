# Iqra Prep Coach — Setup Guide

## Step 1: Get FREE API Keys (No Credit Card Needed)

### Option A — Groq (RECOMMENDED — Fastest, 100% Free)
1. Go to: https://console.groq.com
2. Click "Sign Up" → use Google or email
3. Go to "API Keys" → click "Create API Key"
4. Copy the key (starts with `gsk_...`)

### Option B — Google Gemini (Also Free)
1. Go to: https://aistudio.google.com
2. Sign in with Google
3. Click "Get API Key" → "Create API Key"
4. Copy the key

---

## Step 2: Create .env.local File

Create a file named `.env.local` in this folder:
`C:\fedral job\CascadeProjects\2048\iqra-prep-coach\.env.local`

Paste this inside (replace with your actual key):

```
# Use Groq (free) — get key at https://console.groq.com
GROQ_API_KEY=gsk_your_groq_key_here

# OR use Gemini (free) — get key at https://aistudio.google.com
GEMINI_API_KEY=your_gemini_key_here

# You can add BOTH for automatic fallback
```

---

## Step 3: Run the App

```
npm run dev
```

Then open: http://localhost:3000

---

## Free Tier Limits (More Than Enough for Iqra's 15-Day Prep)

| Provider | Free Limit | Enough For? |
|----------|-----------|-------------|
| Groq     | 14,400 requests/day, 30 RPM | ✅ Yes — easily covers all daily MCQs |
| Gemini   | 1,500 requests/day, 15 RPM | ✅ Yes for daily use |

---

## Cost: Rs. 0 — Completely Free!
