# Orthodox Sermon Forge with Cloudflare Backend

This package improves the standalone Orthodox Sermon Forge app by adding optional Cloudflare Pages Functions.

The app still works as a normal static HTML app if you do not configure the backend.

## File tree

```text
orthodox-sermon-forge-backend/
  index.html
  README.md
  _headers
  functions/
    api/
      generate.js
      health.js
```

## What each file does

```text
index.html
```

The front-end app. It works locally and can generate sermons without any backend.

```text
functions/api/health.js
```

A small backend health-check endpoint at:

```text
/api/health
```

It tells the app whether the backend exists and whether an OpenAI API key is configured. It never reveals the key.

```text
functions/api/generate.js
```

The secure server-side sermon generator endpoint at:

```text
/api/generate
```

The browser sends sermon settings to this endpoint. The function calls OpenAI from Cloudflare's server environment. Your API key is never placed in the browser.

```text
_headers
```

Basic security headers for the deployed site.

## Cloudflare Pages settings

Use:

```text
Framework preset: None
Build command: leave blank
Build output directory: /
```

Cloudflare Pages Functions are detected from the root `functions/` folder.

## Required Cloudflare secret for backend AI

In Cloudflare:

1. Go to your Pages project.
2. Open **Settings**.
3. Open **Variables and Secrets**.
4. Add a secret named:

```text
OPENAI_API_KEY
```

5. Paste your real OpenAI API key.
6. Save.
7. Redeploy.

Optional variable:

```text
OPENAI_MODEL
```

Recommended starter value:

```text
gpt-4.1-mini
```

You may change that to a model available on your OpenAI account.

## Local testing

You can double-click `index.html` and the local sermon generator will work.

The backend AI button only works after deployment to Cloudflare Pages with the functions folder and secret configured.

## Git Bash upload commands

```bash
cd ~/Desktop/orthodox-sermon-forge-backend

git init
git add .
git commit -m "Add Orthodox Sermon Forge backend functions"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/orthodox-sermon-forge-backend.git
git push -u origin main
```

## Safety warning

Do not push API keys, passwords, `.env`, `.dev.vars`, proprietary company data, customer data, copyrighted books you do not have permission to publish, or confidential pastoral/family notes to GitHub.
