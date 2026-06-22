# Carissa's Enoch Study

A GitHub Pages–friendly devotional study app for reading and understanding *The Book of Enoch* in the R. H. Charles translation.

This version was rebuilt as a **static website** so GitHub Pages can open it directly. There is no Node/Express backend required for the live GitHub Pages site.

## File structure

```text
carissa-enoch-github-pages/
├── index.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── parser.js
│   │   ├── starter-book.js
│   │   ├── storage.js
│   │   └── study-engine.js
│   ├── data/
│   │   └── source-manifest.json
│   └── img/
│       └── cross.svg
├── tests/
│   └── smoke-test.mjs
├── package.json
├── SOURCE_NOTICE.md
├── LICENSE
├── .nojekyll
└── README.md
```

## How to open locally

Use a small local web server. Do **not** rely on double-clicking `index.html`, because modern browsers may block JavaScript module imports from `file://`.

Fastest Visual Studio Code method:

1. Install the **Live Server** extension.
2. Right-click `index.html`.
3. Choose **Open with Live Server**.

Alternative terminal method:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## How to upload to GitHub

1. Unzip this folder.
2. Create a new GitHub repository.
3. Upload the **contents** of this folder, not just the zip file.
4. Make sure `index.html` is at the repository root.
5. Go to **Settings → Pages**.
6. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
7. Save.
8. GitHub will provide a Pages URL.

## Why this structure works better

GitHub Pages is for static sites. This version uses only HTML, CSS, JavaScript, SVG, and browser storage. It does not require an Express server, database, npm install, or Render deployment.

## Full text behavior

The app has three layers:

1. **Browser cache** — once a full R. H. Charles text is loaded, it is saved locally in the browser.
2. **Native text loader** — attempts to fetch and parse the public-domain Project Gutenberg source.
3. **Manual paste fallback** — if browser CORS blocks the fetch, paste the Project Gutenberg HTML/text once in the Text Loader tab.
4. **Embedded source portal** — the Full Reader tab also embeds the official Project Gutenberg text page.

A starter excerpt is bundled so the app always opens cleanly, even when the browser blocks cross-origin text loading.

## Local tests

Node is not needed to run the website, but you can run the smoke test if Node is installed:

```bash
npm test
```

## Browser storage

Notes, favorites, reading progress, theme, settings, and cached full-text data are saved in the browser with `localStorage`.

Use **Backup app data** before clearing browser history or switching computers.
