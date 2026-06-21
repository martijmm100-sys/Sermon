export async function onRequestGet(context) {
  const { env } = context;

  return new Response(
    JSON.stringify({
      ok: true,
      service: "Orthodox Sermon Forge backend",
      openAiConfigured: Boolean(env.OPENAI_API_KEY),
      modelConfigured: Boolean(env.OPENAI_MODEL),
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function onRequest(context) {
  return new Response(
    JSON.stringify({ ok: false, error: "Method not allowed. Use GET." }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Allow": "GET"
      }
    }
  );
}
