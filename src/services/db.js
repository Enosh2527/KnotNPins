// Simple API wrapper for Express backend

const handleResponse = async (res) => {
  if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
  if (res.status === 204) return null; // Used for DELETE
  return res.json();
};

// CRUD for Purchases
export const getPurchases = async () => {
  const res = await fetch('/api/purchases');
  return handleResponse(res);
};
export const addPurchase = async (purchase) => {
  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase)
  });
  return handleResponse(res);
};
export const deletePurchase = async (id) => {
  const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
  return handleResponse(res);
};

// CRUD for Sales
export const getSales = async () => {
  const res = await fetch('/api/sales');
  return handleResponse(res);
};
export const addSale = async (sale) => {
  const res = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sale)
  });
  return handleResponse(res);
};
export const deleteSale = async (id) => {
  const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
  return handleResponse(res);
};

// CRUD for Expenses
export const getExpenses = async () => {
  const res = await fetch('/api/expenses');
  return handleResponse(res);
};
export const addExpense = async (expense) => {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  });
  return handleResponse(res);
};
export const deleteExpense = async (id) => {
  const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
  return handleResponse(res);
};

// Initialize Dummy Data (Server keeps it simple but let's do this sequentially if empty)
export const seedDummyData = async () => {
  try {
    const p = await getPurchases();
    if (p.length === 0) {
      await addPurchase({ date: new Date().toISOString().split('T')[0], itemName: 'Gold Chains', quantity: 50, unitCost: 10, totalCost: 500 });
      await addPurchase({ date: new Date().toISOString().split('T')[0], itemName: 'Pendants', quantity: 100, unitCost: 5, totalCost: 500 });
    }
    const s = await getSales();
    if (s.length === 0) {
      await addSale({ date: new Date().toISOString().split('T')[0], itemSold: 'Gold Chain with Pendant', quantity: 2, sellingPrice: 35, paymentMethod: 'UPI' });
    }
    const e = await getExpenses();
    if (e.length === 0) {
      await addExpense({ date: new Date().toISOString().split('T')[0], category: 'Operating Expenses', amount: 15, description: 'Auto fare to market' });
    }
  } catch (err) {
    console.error("Failed to seed dummy data:", err);
  }
};
