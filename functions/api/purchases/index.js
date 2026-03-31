export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM purchases ORDER BY createdAt DESC').all();
    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const purchase = await request.json();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO purchases (id, date, itemName, quantity, unitCost, totalCost, sellingPricePerUnit, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, purchase.date, purchase.itemName, purchase.quantity, 
      purchase.unitCost, purchase.totalCost, purchase.sellingPricePerUnit || 0, createdAt
    ).run();

    return Response.json({ id, createdAt, ...purchase }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
