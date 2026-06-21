const MAX_FIELD_CHARS = 2500;
const MAX_NOTES_CHARS = 5000;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value, maxChars = MAX_FIELD_CHARS) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxChars);
}

function buildPrompt(input) {
  return `
Create a conservative Byzantine Orthodox sermon research draft.

User settings:
- Passage or topic: ${input.passage}
- Sermon theme: ${input.theme}
- Audience: ${input.audience}
- Length: ${input.length}
- History / archaeology mode: ${input.mode}
- Patristic emphasis: ${input.father}
- User notes: ${input.notes || "None provided"}

Required sermon structure:
1. Title
2. Scripture passage
3. Conservative source boundary
4. Historical and canonical context
5. Original-language notes
6. Oldest manuscript and textual witness checkpoints
7. Church Father commentary using St. John Chrysostom, St. Basil the Great, and St. Gregory the Theologian where appropriate
8. Orthodox doctrinal teaching
9. Archaeology, theology, and secular history evidence section
10. What the evidence can and cannot prove
11. Sermon body
12. Practical family application
13. Warnings against misinterpretation
14. Closing prayer
15. Verification checklist

Strict evidence rules:
- Do not invent quotations, manuscripts, archaeology, or source titles.
- If you are not certain of a quotation, label it as "verify before teaching" instead of presenting it as exact.
- Separate textual evidence, archaeological evidence, secular-history evidence, theological interpretation, and pastoral application.
- Do not claim an artifact proves the Resurrection, Incarnation, Eucharist, or final judgment.
- Use the Septuagint as the preferred Old Testament comparison point for Orthodox framing.
- Use the Greek New Testament as the preferred New Testament comparison point.
- Mention major manuscript witnesses only as witnesses, not as the original autograph.
- Eschatology must avoid date-setting and sensationalism.
- If comparing end-times views, compare Orthodox, Catholic, Protestant, Jewish/Second Temple, and secular-historical readings fairly.
- Do not attack other traditions. Contrast carefully.
- Keep the tone reverent, practical, sober, and family-appropriate.

Output in clean Markdown.
`;
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
      if (content.type === "text" && content.text) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return jsonResponse(
      {
        ok: false,
        error: "OPENAI_API_KEY is not configured in Cloudflare Pages Variables and Secrets."
      },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON request body." }, 400);
  }

  const input = {
    passage: clean(body.passage),
    theme: clean(body.theme),
    audience: clean(body.audience),
    length: clean(body.length),
    mode: clean(body.mode),
    father: clean(body.father),
    notes: clean(body.notes, MAX_NOTES_CHARS)
  };

  if (!input.passage && !input.theme) {
    return jsonResponse(
      { ok: false, error: "Provide a Bible passage, topic, or sermon theme." },
      400
    );
  }

  const model = clean(env.OPENAI_MODEL || "gpt-4.1-mini", 80);

  const systemMessage =
    "You are a conservative Byzantine Orthodox sermon research assistant. " +
    "You do not invent evidence. You label uncertainty. You distinguish Scripture, Church Father commentary, archaeology, secular history, doctrine, and pastoral application. " +
    "You write reverently and practically for a family audience.";

  const openAiPayload = {
    model,
    input: [
      { role: "system", content: systemMessage },
      { role: "user", content: buildPrompt(input) }
    ],
    temperature: 0.2,
    max_output_tokens: 3500
  };

  let openAiResponse;
  try {
    openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(openAiPayload)
    });
  } catch (error) {
    return jsonResponse(
      { ok: false, error: "Could not reach OpenAI from the Cloudflare Function." },
      502
    );
  }

  const data = await openAiResponse.json().catch(() => ({}));

  if (!openAiResponse.ok) {
    const message =
      data?.error?.message ||
      `OpenAI request failed with status ${openAiResponse.status}.`;

    return jsonResponse({ ok: false, error: message }, 502);
  }

  const markdown = extractOutputText(data);

  if (!markdown) {
    return jsonResponse(
      { ok: false, error: "OpenAI returned no sermon text." },
      502
    );
  }

  return jsonResponse({
    ok: true,
    model,
    markdown,
    generatedAt: new Date().toISOString()
  });
}

export async function onRequest(context) {
  return jsonResponse(
    { ok: false, error: "Method not allowed. Use POST." },
    405
  );
}
