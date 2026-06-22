import { Storage } from "./storage.js";
import { parseEnochSource } from "./parser.js";
import { STARTER_SOURCE } from "./starter-book.js";
import { buildStudyForPassage, formatRange } from "./study-engine.js";

const REMOTE_SOURCES = [
  {
    label: "Project Gutenberg HTML",
    url: "https://www.gutenberg.org/files/77935/77935-h/77935-h.htm"
  },
  {
    label: "Project Gutenberg cache HTML",
    url: "https://www.gutenberg.org/cache/epub/77935/pg77935-images.html"
  },
  {
    label: "AllOrigins raw proxy",
    url: "https://api.allorigins.win/raw?url=https%3A%2F%2Fwww.gutenberg.org%2Ffiles%2F77935%2F77935-h%2F77935-h.htm"
  }
];

const DEFAULT_SETTINGS = {
  verseCount: 10,
  startDate: todayIso(),
  calendarMode: true,
  theme: "light"
};

const state = {
  book: null,
  settings: { ...DEFAULT_SETTINGS, ...Storage.get("settings", {}) },
  progress: Storage.get("progress", { completedReadings: 0, manualOffset: 0, completedDates: [] }),
  notes: Storage.get("notes", []),
  favorites: Storage.get("favorites", []),
  activeChapter: 1,
  activeTab: "today",
  currentVerses: []
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

boot();

async function boot() {
  wireNavigation();
  wireControls();
  applySettingsToUi();
  setTheme(state.settings.theme);

  state.book = await loadBestBook();
  state.activeChapter = state.book.chapters[0]?.number || 1;

  renderAll();
  showToast("Reader ready. Browser-local saving is active.");
}

async function loadBestBook() {
  setSourceStatus("warning", "Preparing reader...", "Checking browser cache and public-domain source options.");

  const cached = Storage.get("bookCache");
  if (cached?.chapters?.length && cached?.verses?.length) {
    setSourceStatus(cached.stats?.complete ? "ready" : "warning", cached.stats?.complete ? "Complete native reader loaded" : "Starter reader loaded", `Loaded from this browser: ${cached.stats.chapterCount} chapters and ${cached.stats.verseCount} verses.`);
    return cached;
  }

  try {
    return await loadRemoteBook();
  } catch (error) {
    console.warn(error);
    const starter = parseEnochSource(STARTER_SOURCE, { source: "Bundled starter excerpt from Project Gutenberg eBook 77935" });
    setSourceStatus("warning", "Starter reader active", "The app opened successfully. Native full-text loading can be attempted from the Text Loader tab, and the complete Gutenberg portal is embedded in the Full Reader.");
    return starter;
  }
}

async function loadRemoteBook(log = () => {}) {
  let lastError = null;

  for (const source of REMOTE_SOURCES) {
    try {
      log(`Trying ${source.label}...`);
      const response = await fetch(source.url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const book = parseEnochSource(text, { source: source.label });
      if (!book.stats.complete) {
        throw new Error(`Parsed ${book.stats.chapterCount} chapters / ${book.stats.verseCount} verses; expected complete text.`);
      }
      Storage.set("bookCache", book);
      setSourceStatus("ready", "Complete native reader loaded", `Parsed ${book.stats.chapterCount} chapters and ${book.stats.verseCount} verses from ${source.label}.`);
      log(`Success: ${book.stats.chapterCount} chapters and ${book.stats.verseCount} verses loaded.`);
      return book;
    } catch (error) {
      lastError = error;
      log(`Failed: ${source.label} — ${error.message}`);
    }
  }

  throw lastError || new Error("No remote source could be loaded.");
}

function wireNavigation() {
  $$(".nav-links a, .hero-actions a, .brand").forEach((link) => {
    link.addEventListener("click", (event) => {
      const tab = link.dataset.tabLink;
      if (!tab) return;
      event.preventDefault();
      setActiveTab(tab);
      history.replaceState(null, "", `#${tab}`);
    });
  });

  $(".nav-toggle").addEventListener("click", () => {
    const nav = $("#primary-nav");
    const open = nav.classList.toggle("open");
    $(".nav-toggle").setAttribute("aria-expanded", String(open));
  });

  const initial = location.hash.replace("#", "");
  if (initial) setActiveTab(initial);
}

function setActiveTab(tab) {
  state.activeTab = tab;
  $$("[data-tab-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.tabPanel === tab));
  $$("[data-tab-link]").forEach((link) => link.classList.toggle("active", link.dataset.tabLink === tab));
  $("#primary-nav").classList.remove("open");
  $(".nav-toggle").setAttribute("aria-expanded", "false");

  if (tab === "reader") renderReader();
  if (tab === "journal") renderJournal();
  if (tab === "garden") renderGarden();
}

function wireControls() {
  $("#themeToggle").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveSettings();
    setTheme(state.settings.theme);
  });

  $("#verseCount").addEventListener("input", (event) => {
    state.settings.verseCount = Number(event.target.value);
    $("#verseCountOutput").textContent = state.settings.verseCount;
    saveSettings();
    renderDailyReading();
  });

  $("#startDate").addEventListener("change", (event) => {
    state.settings.startDate = event.target.value || todayIso();
    saveSettings();
    renderDailyReading();
  });

  $("#calendarMode").addEventListener("change", (event) => {
    state.settings.calendarMode = event.target.checked;
    saveSettings();
    renderDailyReading();
  });

  $("#previousReading").addEventListener("click", () => {
    state.progress.manualOffset = Math.max(0, state.progress.manualOffset - state.settings.verseCount);
    saveProgress();
    renderDailyReading();
  });

  $("#nextReading").addEventListener("click", () => {
    state.progress.manualOffset = getReadingStartIndex() + state.settings.verseCount;
    saveProgress();
    renderDailyReading();
  });

  $("#markComplete").addEventListener("click", () => {
    const stamp = todayIso();
    if (!state.progress.completedDates.includes(stamp)) {
      state.progress.completedDates.push(stamp);
    }
    state.progress.completedReadings += 1;
    state.progress.manualOffset = getReadingStartIndex() + state.settings.verseCount;
    saveProgress();
    renderDailyReading();
    renderProgress();
    showToast("Reading marked complete. A new pane lit up for Carissa.");
  });

  $("#resetProgress").addEventListener("click", () => {
    if (!confirm("Reset reading progress? Notes and favorites will remain.")) return;
    state.progress = { completedReadings: 0, manualOffset: 0, completedDates: [] };
    saveProgress();
    renderDailyReading();
    renderProgress();
    showToast("Progress reset.");
  });

  $("#favoriteReading").addEventListener("click", () => {
    const range = formatRange(state.currentVerses);
    const exists = state.favorites.some((favorite) => favorite.range === range);
    if (!exists) {
      state.favorites.push({ range, savedAt: new Date().toISOString(), verses: state.currentVerses });
      Storage.set("favorites", state.favorites);
      showToast("Passage saved as a favorite.");
    } else {
      showToast("This passage is already in favorites.");
    }
    renderGarden();
  });

  $("#copyReading").addEventListener("click", async () => {
    const text = state.currentVerses.map((verse) => `${verse.id} ${verse.text}`).join("\n\n");
    await navigator.clipboard.writeText(`${formatRange(state.currentVerses)}\n\n${text}`);
    showToast("Reading copied.");
  });

  $("#printStudy").addEventListener("click", () => window.print());
  $("#exportMarkdown").addEventListener("click", exportMarkdown);
  $("#exportJson").addEventListener("click", () => Storage.download("carissa-enoch-study-backup.json", JSON.stringify(Storage.backup(), null, 2), "application/json"));
  $("#importJson").addEventListener("change", importJsonBackup);

  $("#searchInput").addEventListener("input", renderReader);
  $("#chapterSelect").addEventListener("change", (event) => {
    state.activeChapter = Number(event.target.value);
    renderReader();
  });

  $("#journalForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = $("#journalTitleInput").value.trim() || `Journal entry — ${new Date().toLocaleDateString()}`;
    const body = $("#journalBodyInput").value.trim();
    if (!body) {
      showToast("Write a note before saving.");
      return;
    }

    state.notes.unshift({
      id: crypto.randomUUID(),
      title,
      body,
      range: formatRange(state.currentVerses),
      createdAt: new Date().toISOString()
    });
    Storage.set("notes", state.notes);
    event.target.reset();
    renderJournal();
    renderGarden();
    showToast("Journal entry saved.");
  });

  $("#newLoveNote").addEventListener("click", renderLoveNote);
  $("#loadFullTextButton").addEventListener("click", attemptFullLoad);
  $("#builderLoadButton").addEventListener("click", attemptFullLoad);
  $("#manualBuildButton").addEventListener("click", buildManualReader);
}

function applySettingsToUi() {
  $("#verseCount").value = state.settings.verseCount;
  $("#verseCountOutput").textContent = state.settings.verseCount;
  $("#startDate").value = state.settings.startDate || todayIso();
  $("#calendarMode").checked = Boolean(state.settings.calendarMode);
}

function renderAll() {
  renderDailyReading();
  renderProgress();
  renderReader();
  renderJournal();
  renderGarden();
  renderLoveNote();
}

function renderDailyReading() {
  const verses = state.book.verses || [];
  if (!verses.length) {
    $("#dailyVerses").innerHTML = `<p class="muted">No verses loaded yet.</p>`;
    return;
  }

  const start = getReadingStartIndex();
  const count = state.settings.verseCount;
  const selection = sliceCircular(verses, start, count);
  state.currentVerses = selection;

  $("#readingMeta").textContent = `${formatRange(selection)} • ${selection.length} verses • ${state.book.stats.complete ? "Complete native text" : "Starter excerpt / loader available"}`;

  const container = $("#dailyVerses");
  container.innerHTML = "";
  selection.forEach((verse) => container.appendChild(createVerseCard(verse)));

  renderStudy(selection);
  renderProgress();
}

function getReadingStartIndex() {
  const total = Math.max(1, state.book.verses.length);
  if (state.settings.calendarMode) {
    const start = new Date(`${state.settings.startDate || todayIso()}T00:00:00`);
    const now = new Date(`${todayIso()}T00:00:00`);
    const dayDelta = Math.max(0, Math.floor((now - start) / 86400000));
    return (dayDelta * state.settings.verseCount) % total;
  }
  return (state.progress.manualOffset || 0) % total;
}

function sliceCircular(items, start, count) {
  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(start + index) % items.length]);
}

function createVerseCard(verse, searchTerm = "") {
  const template = $("#verseTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  $(".verse-ref", node).textContent = verse.id;
  $(".verse-ref", node).addEventListener("click", () => {
    state.activeChapter = verse.chapter;
    setActiveTab("reader");
    setTimeout(() => {
      const target = document.getElementById(`verse-${cssSafeId(verse.id)}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.classList.add("pulse");
    }, 50);
  });

  $(".verse-text", node).innerHTML = searchTerm ? highlight(verse.text, searchTerm) : escapeHtml(verse.text);
  node.id = `verse-${cssSafeId(verse.id)}`;
  return node;
}

function renderStudy(verses) {
  const study = buildStudyForPassage(verses);
  const grid = $("#studyBreakdown");
  grid.innerHTML = "";

  study.items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "study-item";
    article.innerHTML = `
      <h4>${escapeHtml(item.title)}</h4>
      ${item.list ? `<ul>${item.list.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : `<p>${escapeHtml(item.body)}</p>`}
    `;
    grid.appendChild(article);
  });

  const review = $("#lampstandReview");
  review.innerHTML = "";
  study.review.forEach((question, index) => {
    const item = document.createElement("div");
    item.className = "review-item";
    const id = `review-${index}`;
    item.innerHTML = `
      <label for="${id}">${index + 1}. ${escapeHtml(question)}</label>
      <textarea id="${id}" rows="2" placeholder="Write your answer here. This is not saved unless you copy it into the journal."></textarea>
    `;
    review.appendChild(item);
  });
}

function renderProgress() {
  const total = Math.max(1, state.book.verses.length);
  const completed = Math.min(total, state.progress.completedReadings * state.settings.verseCount);
  const pct = Math.round((completed / total) * 100);
  const circumference = 327;
  $("#progressCircle").style.strokeDashoffset = String(circumference - (circumference * pct) / 100);
  $("#progressPercent").textContent = `${pct}%`;
  $("#progressDetail").textContent = `${completed} of ${total} verses credited through completed readings.`;
}

function renderReader() {
  if (!state.book) return;

  const chapterSelect = $("#chapterSelect");
  chapterSelect.innerHTML = state.book.chapters.map((chapter) => `<option value="${chapter.number}">Chapter ${chapter.number}</option>`).join("");
  chapterSelect.value = String(state.activeChapter);

  const rail = $("#chapterRail");
  rail.innerHTML = "";
  state.book.chapters.forEach((chapter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Chapter ${chapter.number}`;
    button.classList.toggle("active", chapter.number === state.activeChapter);
    button.addEventListener("click", () => {
      state.activeChapter = chapter.number;
      renderReader();
    });
    rail.appendChild(button);
  });

  const searchTerm = $("#searchInput").value.trim();
  const scroll = $("#readerScroll");
  scroll.innerHTML = "";

  if (searchTerm) {
    const matches = state.book.verses
      .filter((verse) => verse.text.toLowerCase().includes(searchTerm.toLowerCase()) || verse.id.includes(searchTerm))
      .slice(0, 150);

    scroll.innerHTML = `<h3>Search results</h3><p class="muted">${matches.length} results shown for “${escapeHtml(searchTerm)}”.</p>`;
    matches.forEach((verse) => scroll.appendChild(createVerseCard(verse, searchTerm)));
    return;
  }

  const chapter = state.book.chapters.find((item) => item.number === state.activeChapter) || state.book.chapters[0];
  scroll.innerHTML = `<h3>${escapeHtml(chapter.title)}</h3><p class="muted">${escapeHtml(chapter.section)} • ${chapter.verses.length} verses</p>`;
  chapter.verses.forEach((verse) => scroll.appendChild(createVerseCard(verse)));
}

function renderJournal() {
  const entries = $("#journalEntries");
  if (!state.notes.length) {
    entries.innerHTML = `<p class="muted">No entries yet. Save your first observation after today's reading.</p>`;
    return;
  }

  entries.innerHTML = "";
  state.notes.forEach((note) => {
    const article = document.createElement("article");
    article.className = "entry-card";
    article.innerHTML = `
      <h4>${escapeHtml(note.title)}</h4>
      <small>${new Date(note.createdAt).toLocaleString()} • ${escapeHtml(note.range || "General note")}</small>
      <p>${escapeHtml(note.body).replace(/\n/g, "<br>")}</p>
      <div class="entry-actions">
        <button class="button small ghost" type="button" data-copy="${note.id}">Copy</button>
        <button class="button small danger" type="button" data-delete="${note.id}">Delete</button>
      </div>
    `;
    entries.appendChild(article);
  });

  $$("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.notes = state.notes.filter((note) => note.id !== button.dataset.delete);
      Storage.set("notes", state.notes);
      renderJournal();
      renderGarden();
      showToast("Journal entry deleted.");
    });
  });

  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const note = state.notes.find((item) => item.id === button.dataset.copy);
      await navigator.clipboard.writeText(`# ${note.title}\n\n${note.range}\n${note.createdAt}\n\n${note.body}`);
      showToast("Journal entry copied.");
    });
  });
}

function renderGarden() {
  const grid = $("#gardenGrid");
  const lit = Math.min(72, state.progress.completedReadings + state.notes.length + state.favorites.length);
  const icons = ["✦", "☩", "✧", "✿", "🕯"];
  grid.innerHTML = "";

  for (let index = 0; index < 72; index += 1) {
    const tile = document.createElement("div");
    tile.className = "garden-tile";
    tile.textContent = index < lit ? icons[index % icons.length] : "·";
    tile.style.opacity = index < lit ? "1" : ".34";
    grid.appendChild(tile);
  }
}

function renderLoveNote() {
  const notes = [
    {
      title: "Carissa, you are deeply loved.",
      body: "Your husband wanted this study to feel like a quiet chapel: beautiful, peaceful, and made with intention."
    },
    {
      title: "Carissa, your faith matters.",
      body: "Every reading completed here is a small lamp lit for wisdom, peace, and a home centered on God."
    },
    {
      title: "Carissa, you are worth the craftsmanship.",
      body: "This was not made as a quick file. It was made as an act of care, prayer, and affection."
    },
    {
      title: "Carissa, may this study bless your heart.",
      body: "When the text is difficult, may the Lord give discernment. When the themes are heavy, may He give peace."
    },
    {
      title: "Carissa, your husband loves you.",
      body: "May every page remind you that you are cherished, protected, and prayed over."
    }
  ];

  const note = notes[Math.floor(Math.random() * notes.length)];
  $("#loveNoteTitle").textContent = note.title;
  $("#loveNoteBody").textContent = note.body;
}

async function attemptFullLoad() {
  const logBox = $("#loaderLog");
  const log = (line) => {
    if (logBox) logBox.textContent += `${new Date().toLocaleTimeString()} — ${line}\n`;
  };

  if (logBox) logBox.textContent = "";
  try {
    const book = await loadRemoteBook(log);
    state.book = book;
    renderAll();
    showToast("Complete native reader loaded and cached.");
  } catch (error) {
    log(`Final result: ${error.message}`);
    setSourceStatus("warning", "Full native loading blocked", "This usually means browser CORS blocked the fetch. Use the embedded Gutenberg reader or paste the source text once in the Text Loader.");
    showToast("Full native loading was blocked. The app still works; use the Text Loader paste fallback.");
  }
}

function buildManualReader() {
  const source = $("#manualSource").value.trim();
  if (!source) {
    showToast("Paste the Gutenberg HTML or text first.");
    return;
  }

  try {
    const book = parseEnochSource(source, { source: "Manual Project Gutenberg paste" });
    if (book.chapters.length < 5 || book.verses.length < 30) {
      throw new Error(`Only parsed ${book.chapters.length} chapters and ${book.verses.length} verses.`);
    }
    Storage.set("bookCache", book);
    state.book = book;
    setSourceStatus(book.stats.complete ? "ready" : "warning", book.stats.complete ? "Complete native reader loaded" : "Manual reader loaded", `Parsed ${book.stats.chapterCount} chapters and ${book.stats.verseCount} verses.`);
    renderAll();
    showToast("Manual reader built and saved in this browser.");
  } catch (error) {
    showToast(`Could not build reader: ${error.message}`);
  }
}

function exportMarkdown() {
  const lines = [
    "# Carissa Enoch Study Export",
    "",
    `Exported: ${new Date().toLocaleString()}`,
    "",
    "## Current Reading",
    "",
    `${formatRange(state.currentVerses)}`,
    "",
    ...state.currentVerses.map((verse) => `> **${verse.id}** ${verse.text}`),
    "",
    "## Journal Entries",
    "",
    ...state.notes.flatMap((note) => [
      `### ${note.title}`,
      `_${note.range || "General"} • ${new Date(note.createdAt).toLocaleString()}_`,
      "",
      note.body,
      ""
    ]),
    "## Favorites",
    "",
    ...state.favorites.map((favorite) => `- ${favorite.range}`)
  ];

  Storage.download("carissa-enoch-study-notes.md", lines.join("\n"), "text/markdown");
}

async function importJsonBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    Storage.restore(JSON.parse(text));
    showToast("Backup restored. Reloading app.");
    setTimeout(() => location.reload(), 700);
  } catch (error) {
    showToast(`Restore failed: ${error.message}`);
  }
}

function saveSettings() {
  Storage.set("settings", state.settings);
}

function saveProgress() {
  Storage.set("progress", state.progress);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("#themeToggle").textContent = theme === "dark" ? "☾" : "☀︎";
}

function setSourceStatus(kind, title, detail) {
  const dot = $("#sourceDot");
  dot.className = `status-dot ${kind}`;
  $("#sourceStatus").textContent = title;
  $("#sourceDetail").textContent = detail;
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  $("#toastRegion").appendChild(toast);
  setTimeout(() => toast.remove(), 4200);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlight(text, term) {
  const safe = escapeHtml(text);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

function cssSafeId(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, "-");
}
