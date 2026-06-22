const SECTION_GUIDES = [
  {
    test: /Opening Parable/i,
    context: "The opening chapters frame Enoch as a witness to judgment, mercy, peace, and the moral order of creation.",
    bigIdea: "God's ordered creation becomes a mirror: steadfastness, humility, and peace are contrasted with pride and rebellion.",
    watchFor: "Repeated language about righteousness, peace, judgment, light, and the created order.",
    crossReferences: ["Genesis 5:21-24", "Jude 14-15", "Psalm 19:1-6", "Matthew 5:5", "Hebrews 11:5"],
    prayer: "Lord, make me steadfast where I have been unstable, humble where I have been proud, and faithful where I have been distracted."
  },
  {
    test: /Watchers|Human Corruption|Intercession/i,
    context: "These chapters describe the Watchers, human corruption, heavenly intercession, and divine judgment. Read devotionally but with care, since this is ancient apocalyptic literature, not canonical Scripture for most Christians.",
    bigIdea: "Sin spreads when power is misused, but the cries of the wounded are not hidden from God.",
    watchFor: "Notice how corruption affects households, knowledge, violence, creation, and worship.",
    crossReferences: ["Genesis 6:1-8", "2 Peter 2:4-9", "Jude 6", "Psalm 10:14", "Romans 8:19-23"],
    prayer: "Holy God, protect my home from corrupted desires, teach me to use knowledge rightly, and make me attentive to the cries of the wounded."
  },
  {
    test: /Scribe|Petition|Refused/i,
    context: "Enoch appears as a scribe and messenger. The passage emphasizes accountability, petition, and the seriousness of rebellion.",
    bigIdea: "There are moments when truth must be spoken plainly, even when the message is hard.",
    watchFor: "Look for the distinction between sorrow over consequences and true repentance.",
    crossReferences: ["Ezekiel 33:7-9", "James 3:1", "Hebrews 4:13", "1 John 1:9"],
    prayer: "Lord, make me truthful without cruelty, repentant without excuse-making, and faithful in hard conversations."
  },
  {
    test: /Journeys|Cosmos|Judgment/i,
    context: "The journey material uses cosmic geography and symbolic scenery to teach moral seriousness.",
    bigIdea: "The unseen world is portrayed as ordered under God's authority; nothing is random or beyond His notice.",
    watchFor: "Mountains, fire, stars, waters, gates, and valleys are not just scenery; they carry moral meaning.",
    crossReferences: ["Job 38", "Psalm 24", "Revelation 20:11-15", "Psalm 139:7-12"],
    prayer: "Lord of heaven and earth, enlarge my reverence and help me live today as one seen by You."
  },
  {
    test: /Parables|Similitudes|Son of Man/i,
    context: "The Parables/Similitudes contain major themes of righteousness, final judgment, and a Son of Man figure. Christians often read this section with careful comparison to New Testament Son of Man language.",
    bigIdea: "Hope is anchored in God's righteous judgment and the vindication of the faithful.",
    watchFor: "Son of Man language, thrones, kings, mighty ones, hidden wisdom, and comfort for the righteous.",
    crossReferences: ["Daniel 7:13-14", "Matthew 24:30", "Matthew 25:31-46", "Revelation 1:12-18"],
    prayer: "King of righteousness, train my hope on Your kingdom rather than the approval of the powerful."
  },
  {
    test: /Luminaries|Creation/i,
    context: "The heavenly luminaries section reflects ancient concern for ordered time, calendars, seasons, and obedience in creation.",
    bigIdea: "The created order becomes a classroom for discipline, rhythm, and faithfulness.",
    watchFor: "Gates, courses, seasons, years, months, and the reliability of heavenly order.",
    crossReferences: ["Genesis 1:14-19", "Psalm 104:19-24", "Ecclesiastes 3:1-8", "Colossians 1:16-17"],
    prayer: "Creator God, order my days, discipline my habits, and make my time serve Your purposes."
  },
  {
    test: /Dream Visions/i,
    context: "The dream visions retell history through symbols and animal imagery, presenting judgment, suffering, and hope.",
    bigIdea: "History is not meaningless; even suffering is held within God's larger moral horizon.",
    watchFor: "Symbolic animals, shepherds, sheep, judgment scenes, and restoration imagery.",
    crossReferences: ["Daniel 7", "Psalm 23", "John 10:11-16", "Revelation 7:17"],
    prayer: "Good Shepherd, help me trust You when history looks confused and violent."
  },
  {
    test: /Admonitions|Wisdom|Weeks/i,
    context: "This section contains exhortations, woes, wisdom sayings, and the Apocalypse of Weeks.",
    bigIdea: "Wisdom is not only knowing what is true; it is remaining faithful until the end.",
    watchFor: "Warnings to sinners, encouragement to the righteous, written testimony, and final accountability.",
    crossReferences: ["Proverbs 1:7", "Matthew 7:24-27", "James 1:22-25", "Revelation 20:12"],
    prayer: "Lord, make me a doer of truth, not only an admirer of truth."
  },
  {
    test: /Noah|Mercy/i,
    context: "The Noah traditions connect judgment with preservation and mercy.",
    bigIdea: "Even in judgment, God preserves a witness and makes room for mercy.",
    watchFor: "Birth, signs, fear, preservation, and hope beyond catastrophe.",
    crossReferences: ["Genesis 6:8-22", "1 Peter 3:20", "Hebrews 11:7", "Matthew 24:37-39"],
    prayer: "God of mercy, make my home a place of faithfulness in a confused generation."
  }
];

export function buildStudyForPassage(verses) {
  const text = verses.map((verse) => verse.text).join(" ");
  const section = verses[0]?.section || "Book of Enoch";
  const guide = SECTION_GUIDES.find((item) => item.test.test(section)) || SECTION_GUIDES[0];

  const keywordNotes = detectKeywords(text);
  const range = formatRange(verses);

  return {
    range,
    items: [
      {
        title: "Plain meaning",
        body: `${guide.bigIdea} In this reading, trace what the passage says about God, human responsibility, and the consequence of rebellion or faithfulness.`
      },
      {
        title: "Historical-literary context",
        body: guide.context
      },
      {
        title: "What to watch",
        body: guide.watchFor
      },
      {
        title: "Christian devotional lens",
        body: "Read this beside Scripture rather than above Scripture. Let it sharpen reverence, moral seriousness, and longing for Christ's righteous kingdom."
      },
      {
        title: "Cross-references",
        list: guide.crossReferences
      },
      {
        title: "Prayer prompt",
        body: guide.prayer
      },
      {
        title: "Detected themes",
        list: keywordNotes.length ? keywordNotes : ["Righteousness", "judgment", "mercy", "faithfulness"]
      },
      {
        title: "Marriage blessing",
        body: "Pause and pray one sentence of blessing over Carissa today. A beautiful study life should produce a more tender home."
      }
    ],
    review: [
      `In one sentence, what is the main point of ${range}?`,
      "What does this reading reveal about God's holiness, mercy, or judgment?",
      "Where does this passage need to be tested carefully against canonical Scripture?",
      "What one action, prayer, or attitude should change today?",
      "What would you explain to someone who has never read Enoch before?"
    ]
  };
}

function detectKeywords(text) {
  const map = [
    [/watchers?|angels?/i, "Heavenly beings and accountability"],
    [/judg|doom|condemn|punish/i, "Judgment and moral consequence"],
    [/righteous|elect|holy/i, "Righteousness and the faithful people of God"],
    [/peace|mercy|forgive/i, "Peace, mercy, and restoration"],
    [/earth|trees|sun|moon|stars|heaven/i, "Creation as witness"],
    [/wisdom|scribe|book|write/i, "Wisdom, testimony, and written witness"],
    [/king|mighty|throne|son of man/i, "Kingdom, authority, and Son of Man imagery"],
    [/Noah|deluge|flood/i, "Noah, preservation, and mercy through judgment"],
    [/blood|violence|oppression/i, "Violence, injustice, and the cries of the wounded"]
  ];

  return map.filter(([regex]) => regex.test(text)).map(([, label]) => label);
}

export function formatRange(verses) {
  if (!verses.length) return "No verses";
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (first.chapter === last.chapter) {
    return `Enoch ${first.chapter}:${first.label}–${last.label}`;
  }
  return `Enoch ${first.chapter}:${first.label}–${last.chapter}:${last.label}`;
}
