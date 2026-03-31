export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM sales ORDER BY createdAt DESC').all();
    return Response.json(results || []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const sale = await request.json();
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const createdAt = new Date().toISOString();
    
    const sourceVal = sale.source && sale.source.trim() !== '' ? sale.source : 'Offline';

    await env.DB.prepare(`
      INSERT INTO sales (id, date, itemSold, quantity, sellingPrice, paymentMethod, source, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, sale.date, sale.itemSold, sale.quantity, 
      sale.sellingPrice, sale.paymentMethod, sourceVal, createdAt
    ).run();

    return Response.json({ id, createdAt, source: sourceVal, ...sale }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
