export const SECTION_MAP = [
  { range: [1, 5], title: "Opening Parable: Judgment, Mercy, and Peace" },
  { range: [6, 11], title: "The Watchers, Human Corruption, and Divine Intervention" },
  { range: [12, 16], title: "Enoch the Scribe and the Refused Petition" },
  { range: [17, 36], title: "Journeys through the Cosmos and Places of Judgment" },
  { range: [37, 71], title: "The Parables / Similitudes: Righteousness, Judgment, and the Son of Man Motif" },
  { range: [72, 82], title: "The Heavenly Luminaries and Ordered Creation" },
  { range: [83, 90], title: "Dream Visions of Judgment, History, and Hope" },
  { range: [91, 105], title: "Admonitions, Wisdom, and the Apocalypse of Weeks" },
  { range: [106, 107], title: "Noah Traditions and Signs of Mercy" },
  { range: [108, 108], title: "Appendix: The Faithful and the Generation of Light" }
];

export function parseEnochSource(source, options = {}) {
  const fullText = htmlToReadableText(source);
  const mainText = isolateTranslation(fullText);
  const chapters = splitChapters(mainText);
  const verses = chapters.flatMap((chapter) => chapter.verses);

  return {
    meta: {
      title: "The Book of Enoch",
      translation: "R. H. Charles",
      contributor: "W. O. E. Oesterley",
      source: options.source || "Project Gutenberg eBook 77935",
      parsedAt: new Date().toISOString(),
      theologicalNote: "1 Enoch is non-canonical for most Christian traditions. This app uses devotional Christian notes while treating the work as ancient religious literature."
    },
    sections: SECTION_MAP,
    chapters,
    verses,
    stats: {
      chapterCount: chapters.length,
      verseCount: verses.length,
      complete: chapters.length >= 100 && verses.length > 1000
    }
  };
}

export function htmlToReadableText(input) {
  if (!input) return "";

  const withoutNoise = String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|li|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<sup[\s\S]*?<\/sup>/gi, " ")
    .replace(/<a[^>]*href="#Footnote_[^"]*"[^>]*>[\s\S]*?<\/a>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  const textarea = document.createElement("textarea");
  textarea.innerHTML = withoutNoise;

  return textarea.value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isolateTranslation(text) {
  const markers = [
    "THE BOOK OF ENOCH\nI-XXXVI.",
    "THE BOOK OF ENOCH I-XXXVI.",
    "I-XXXVI.\nI-V. Parable of Enoch",
    "I-XXXVI. I-V. Parable of Enoch",
    "I. 1. The words of the blessing of Enoch"
  ];

  let start = -1;
  for (const marker of markers) {
    start = text.indexOf(marker);
    if (start >= 0) break;
  }

  if (start < 0) {
    const fallback = text.search(/\bI\.\s+1\.\s+The words of the blessing of Enoch/i);
    start = fallback >= 0 ? fallback : 0;
  }

  let isolated = text.slice(start);
  const endMarkers = [
    "Printed in Great Britain",
    "Footnotes",
    "Transcriber’s Notes",
    "Transcriber's Notes",
    "*** END OF THE PROJECT GUTENBERG EBOOK"
  ];

  let end = isolated.length;
  for (const marker of endMarkers) {
    const idx = isolated.indexOf(marker);
    if (idx > 0) end = Math.min(end, idx);
  }

  return isolated
    .slice(0, end)
    .replace(/\b\d{1,3}\s+(?=[IVXLCDM]{1,5}\.\s+\d+\.)/g, " ")
    .replace(/\b\d{1,3}\s+(?=\d+\.)/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+(?=[IVXLCDM]{1,6}\.\s+\d+\.)/g, "\n")
    .replace(/\s+(?=[IVXLCDM]{1,6}\.\s+[A-Z][A-Z]+\. AN APPENDIX)/g, "\n")
    .trim();
}

function splitChapters(text) {
  const chapterRegex = /(?:^|\n)([IVXLCDM]{1,6})\.\s+/g;
  const matches = [...text.matchAll(chapterRegex)]
    .map((match) => ({
      roman: match[1],
      number: romanToInt(match[1]),
      index: match.index + (match[0].startsWith("\n") ? 1 : 0)
    }))
    .filter((match) => match.number >= 1 && match.number <= 108);

  const unique = [];
  const seen = new Set();

  for (const match of matches) {
    if (!seen.has(match.number)) {
      unique.push(match);
      seen.add(match.number);
    }
  }

  return unique.map((match, idx) => {
    const next = unique[idx + 1];
    const markerLength = `${match.roman}. `.length;
    let rawBody = text.slice(match.index + markerLength, next ? next.index : text.length).trim();
    rawBody = cleanChapterBody(rawBody);
    const section = sectionForChapter(match.number);
    const verses = splitVerses(rawBody, match.number, section.title);
    return {
      number: match.number,
      roman: match.roman,
      title: chapterTitle(match.number, section.title),
      section: section.title,
      text: rawBody,
      verses
    };
  });
}

function cleanChapterBody(rawBody) {
  return rawBody
    .replace(/\s+\d{1,3}\s+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function splitVerses(body, chapterNumber, sectionTitle) {
  const verseRegex = /(^|\s)(\d{1,3})(?:\s*([a-z]))?\.\s+/g;
  const matches = [...body.matchAll(verseRegex)];

  if (matches.length === 0 && body.length) {
    return [{
      id: `${chapterNumber}:1`,
      chapter: chapterNumber,
      verse: 1,
      label: "1",
      section: sectionTitle,
      text: body
    }];
  }

  return matches.map((match, idx) => {
    const number = Number(match[2]);
    const suffix = match[3] || "";
    const label = `${number}${suffix}`;
    const start = match.index + match[0].length;
    const end = idx + 1 < matches.length ? matches[idx + 1].index : body.length;
    const verseText = body.slice(start, end).trim();

    return {
      id: `${chapterNumber}:${label}`,
      chapter: chapterNumber,
      verse: number,
      label,
      section: sectionTitle,
      text: verseText
    };
  }).filter((verse) => verse.text.length > 0);
}

function sectionForChapter(chapterNumber) {
  return SECTION_MAP.find((section) => chapterNumber >= section.range[0] && chapterNumber <= section.range[1]) || SECTION_MAP[0];
}

function chapterTitle(chapterNumber, sectionTitle) {
  return `Chapter ${chapterNumber} — ${sectionTitle}`;
}

function romanToInt(roman) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let previous = 0;

  for (const char of [...roman].reverse()) {
    const value = values[char] || 0;
    total += value < previous ? -value : value;
    previous = value;
  }

  return total;
}
