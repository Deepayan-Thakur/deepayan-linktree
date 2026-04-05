# GitHub Gist Storage Setup Guide

This project uses GitHub Gist to store your linktree data persistently across all browsers and sessions. The **token is stored securely on the server** (Vercel) and never exposed to the frontend.

## Quick Start

### 1. Get Your GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Configure the token:
   - **Token name**: `linktree-gist-storage`
   - **Expiration**: Choose your preference (90 days recommended)
   - **Scopes**: Select only `gist` (check the "gist" checkbox)
4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again)

### 2. Create Your Gist (for data storage)

1. Go to https://gist.github.com
2. Create a new **private** gist with:
   - **Filename**: `linktree-data.json`
   - **Content**: 
   ```json
   {
     "links": [],
     "projects": [],
     "theme": {
       "primaryColor": "#6366f1",
       "secondaryColor": "#a855f7",
       "accentColor": "#ec4899",
       "backgroundColor": "#0f172a"
     },
     "timestamp": "2026-04-06T00:00:00Z"
   }
   ```
   - **Description**: `Deepayan's Creative Linktree - Data Storage`
3. Copy the gist ID from the URL (e.g., `abc123def456`)

### 3. Local Setup (.env.local)

Create a `.env.local` file in the project root:

```plaintext
GITHUB_GIST_TOKEN=ghp_your_token_here
GITHUB_GIST_ID=your_gist_id_here
```

> **Security**: `.env.local` is in `.gitignore` and will never be committed.

### 4. Vercel Deployment

When deploying to Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add **two** variables:
   - Key: `GITHUB_GIST_TOKEN`
   - Value: `ghp_...` (your token)
   
   And:
   - Key: `GITHUB_GIST_ID`
   - Value: `your_gist_id_here`

3. Set both to all environments (Production, Preview, Development)
4. Redeploy your project

## How It Works

### Architecture
```
Frontend (React)
    ↓
Backend API Endpoints (/api/gist-load, /api/gist-save)
    ↓
Environment Variables (GITHUB_GIST_TOKEN, GITHUB_GIST_ID)
    ↓
GitHub Gist API
```

### Data Flow

**On App Load:**
1. React loads from localStorage (instant)
2. Backend API fetches latest from GitHub Gist
3. If newer data exists, updates React state
4. Both stay in sync

**On Data Change:**
1. Data saved to localStorage immediately (fast)
2. Backend API syncs to GitHub Gist in background (non-blocking)
3. If sync fails, localStorage is your backup

## Usage in React

The `gistStorage.ts` utility provides these functions:

```typescript
import { loadFromGist, saveToGist, syncDataToGist, syncDataFromGist } from '@/src/utils/gistStorage';

// Load data from gist via backend API
const data = await loadFromGist();

// Save data to gist via backend API
await saveToGist({
  links: myLinks,
  projects: myProjects,
  theme: myTheme,
  timestamp: new Date().toISOString()
});

// Sync with fallback
const latest = await syncDataFromGist(localData);
```

## Security

✅ **Token never exposed to frontend** - Only backend has access
✅ **Private gist** - Only you can access via the token
✅ **HTTPS only** - All API calls use encrypted connection
✅ **No secret in code** - Environment variables only

### Token Permissions

The token needs **only** the `gist` scope:
- ✅ Can read/write gists
- ❌ Cannot access repos
- ❌ Cannot access user data
- ❌ Cannot push code

## Troubleshooting

### "GitHub token not configured on server"
- Check Vercel Environment Variables are set
- Ensure keys are exactly: `GITHUB_GIST_TOKEN` and `GITHUB_GIST_ID`
- Redeploy after adding variables

### "Failed to load from gist" / "Failed to save to gist"
- Verify token is valid (hasn't expired)
- Check gist ID is correct
- Ensure gist file is named exactly `linktree-data.json`
- Check GitHub status: https://www.githubstatus.com/

### "linktree-data.json not found in gist"
- Create file in gist if missing
- File must be named exactly `linktree-data.json`
- Content must be valid JSON

### Local development not syncing?
- Gist sync requires valid token in `.env.local`
- Check browser console for error messages
- Restart dev server after updating `.env.local`

## API Endpoints

### GET /api/gist-load
Fetches latest data from your GitHub Gist.

**Response:**
```json
{
  "links": [],
  "projects": [],
  "theme": { ... },
  "timestamp": "2026-04-06T00:00:00Z"
}
```

### POST /api/gist-save
Saves data to your GitHub Gist.

**Request Body:**
```json
{
  "data": {
    "links": [],
    "projects": [],
    "theme": { ... },
    "timestamp": "2026-04-06T00:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data saved to gist"
}
```

## Revoking Access

If your token is compromised:

1. Go to https://github.com/settings/tokens
2. Find the token and click "Delete"
3. Generate a new token
4. Update in Vercel Environment Variables
5. Redeploy

The token is immediately invalid everywhere.

## Reference

- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [GitHub Gist API Docs](https://docs.github.com/en/rest/gists/gists)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
