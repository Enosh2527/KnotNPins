

export const calculateInventory = (purchases, sales) => {
  const inventory = {}; // key: itemName, value: { purchasedQty, soldQty, currentStock, avgUnitCost }

  purchases.forEach(p => {
    if (!inventory[p.itemName]) {
      inventory[p.itemName] = { purchasedQty: 0, soldQty: 0, currentStock: 0, totalCost: 0, avgUnitCost: 0 };
    }
    inventory[p.itemName].purchasedQty += Number(p.quantity);
    inventory[p.itemName].totalCost += Number(p.totalCost) || (Number(p.quantity) * Number(p.unitCost));
  });

  sales.forEach(s => {
    // Map itemSold back to itemName if possible, assuming exact match for simplicity
    if (inventory[s.itemSold]) {
      inventory[s.itemSold].soldQty += Number(s.quantity);
    } else {
      // If sale happened for item not explicitly tracked in purchases (edge case)
      inventory[s.itemSold] = { purchasedQty: 0, soldQty: Number(s.quantity), currentStock: 0, totalCost: 0, avgUnitCost: 0 };
    }
  });

  // Calculate current stock and avg cost
  Object.keys(inventory).forEach(key => {
    const item = inventory[key];
    item.currentStock = item.purchasedQty - item.soldQty;
    if (item.purchasedQty > 0) {
      item.avgUnitCost = item.totalCost / item.purchasedQty;
    }
  });

  return Object.entries(inventory).map(([itemName, data]) => ({
    itemName,
    ...data
  }));
};

export const calculateFinancials = (purchases = [], sales = [], expenses = [], dateFilter = 'all') => {
  const now = new Date();
  
  const getFilteredItems = (items, periodOffset = 0) => {
    if (dateFilter === 'all') return periodOffset === 0 ? items : []; // No previous period for 'all'
    
    return items.filter(item => {
      const itemDate = new Date(item.date);
      if (dateFilter === 'daily') {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - periodOffset);
        return itemDate.toDateString() === targetDate.toDateString();
      }
      if (dateFilter === 'monthly') {
        const targetMonth = now.getMonth() - periodOffset;
        let year = now.getFullYear();
        let month = targetMonth;
        if (targetMonth < 0) {
          month = 12 + targetMonth;
          year--;
        }
        return itemDate.getMonth() === month && itemDate.getFullYear() === year;
      }
      if (dateFilter === 'yearly') {
        return itemDate.getFullYear() === (now.getFullYear() - periodOffset);
      }
      return true;
    });
  };

  const calcTotals = (items, type) => {
    return items.reduce((sum, item) => {
      if (type === 'purchases') return sum + (Number(item.totalCost) || (Number(item.quantity) * Number(item.unitCost)));
      if (type === 'sales') return sum + (Number(item.sellingPrice) * Number(item.quantity));
      if (type === 'expenses') return sum + Number(item.amount);
      return sum;
    }, 0);
  };

  const getTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100);
  };

  // Current Period
  const currPurchases = getFilteredItems(purchases, 0);
  const currSales = getFilteredItems(sales, 0);
  const currExpenses = getFilteredItems(expenses, 0);

  const totalInvestment = calcTotals(currPurchases, 'purchases');
  const totalSalesRevenue = calcTotals(currSales, 'sales');
  const totalExpenses = calcTotals(currExpenses, 'expenses');
  const netProfit = totalSalesRevenue - totalInvestment - totalExpenses;

  // Previous Period
  const prevPurchases = getFilteredItems(purchases, 1);
  const prevSales = getFilteredItems(sales, 1);
  const prevExpenses = getFilteredItems(expenses, 1);

  const prevInvestment = calcTotals(prevPurchases, 'purchases');
  const prevSalesRevenue = calcTotals(prevSales, 'sales');
  const prevExpensesTotals = calcTotals(prevExpenses, 'expenses');
  const prevNetProfit = prevSalesRevenue - prevInvestment - prevExpensesTotals;

  return {
    totalInvestment,
    totalSalesRevenue,
    totalExpenses,
    netProfit,
    trends: {
      investment: getTrend(totalInvestment, prevInvestment),
      sales: getTrend(totalSalesRevenue, prevSalesRevenue),
      expenses: getTrend(totalExpenses, prevExpensesTotals),
      profit: prevNetProfit === 0 ? 0 : getTrend(netProfit, prevNetProfit)
    }
  };
};
