export async function onRequestDelete(context) {
  const { env, params } = context;
  try {
    const id = params.id;
    await env.DB.prepare('DELETE FROM sales WHERE id = ?').bind(id).run();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
