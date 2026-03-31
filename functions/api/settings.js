export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM app_settings').all();
    const settings = {};
    results.forEach(row => {
      try {
        settings[row.key_name] = JSON.parse(row.value_json);
      } catch (e) {
        settings[row.key_name] = row.value_json;
      }
    });
    return Response.json(settings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const payload = await request.json();
    
    // Payload should be like: { salesSources: ["Online", "Offline"], paymentMethods: [...] }
    const stmts = [];
    for (const [key, value] of Object.entries(payload)) {
        stmts.push(
          env.DB.prepare(
            `INSERT INTO app_settings (key_name, value_json) VALUES (?, ?) 
             ON CONFLICT(key_name) DO UPDATE SET value_json=excluded.value_json`
          ).bind(key, JSON.stringify(value))
        );
    }
    
    if (stmts.length > 0) {
        await env.DB.batch(stmts);
    }

    return Response.json({ success: true, updated: Object.keys(payload) }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
