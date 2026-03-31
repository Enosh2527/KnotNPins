export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM expenses ORDER BY createdAt DESC').all();
    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const expense = await request.json();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO expenses (id, date, category, amount, description, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id, expense.date, expense.category, 
      expense.amount, expense.description || '', createdAt
    ).run();

    return Response.json({ id, createdAt, ...expense }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
