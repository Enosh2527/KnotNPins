import { useState, useEffect } from 'react';
import { getPurchases, getSales, getExpenses } from '../services/db';
import { exportDataToExcel } from '../utils/export';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function ProfitView() {
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    Promise.all([getPurchases(), getSales(), getExpenses()])
      .then(([p, s, e]) => {
        setPurchases(p);
        setSales(s);
        setExpenses(e);
      })
      .catch(console.error);
  }, []);

  // Calculate totals
  const totalInvested = purchases.reduce((sum, p) => sum + (Number(p.totalCost) || (Number(p.quantity) * Number(p.unitCost))), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.sellingPrice) * Number(s.quantity)), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalSpent = totalInvested + totalExpenses;
  const netProfit = totalRevenue - totalSpent;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Per-item profit breakdown
  const itemProfits = {};
  purchases.forEach(p => {
    const name = p.itemName;
    if (!itemProfits[name]) {
      itemProfits[name] = { name, invested: 0, revenue: 0, profit: 0 };
    }
    itemProfits[name].invested += Number(p.totalCost) || (Number(p.quantity) * Number(p.unitCost));
  });
  sales.forEach(s => {
    const name = s.itemSold;
    if (!itemProfits[name]) {
      itemProfits[name] = { name, invested: 0, revenue: 0, profit: 0 };
    }
    itemProfits[name].revenue += Number(s.sellingPrice) * Number(s.quantity);
  });
  
  const profitData = Object.values(itemProfits)
    .map(item => ({ ...item, profit: item.revenue - item.invested }))
    .sort((a, b) => b.profit - a.profit);

  const exportReport = () => {
    exportDataToExcel([
      { Metric: 'Total Invested', Amount: totalInvested.toFixed(2) },
      { Metric: 'Total Revenue', Amount: totalRevenue.toFixed(2) },
      { Metric: 'Total Expenses', Amount: totalExpenses.toFixed(2) },
      { Metric: 'Net Profit', Amount: netProfit.toFixed(2) },
      { Metric: 'Profit Margin %', Amount: profitMargin },
      {},
      ...profitData.map(p => ({
        Item: p.name,
        Invested: p.invested.toFixed(2),
        Revenue: p.revenue.toFixed(2),
        Profit: p.profit.toFixed(2)
      }))
    ], 'Profit Report', 'KnotPins_ProfitReport');
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="animate-fade-in">
      {/* Big Profit Summary */}
      <div className="card net-profit-glow" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.75rem' }}>Your Overall Profit</p>
        <h2 className="font-tabular" style={{
          fontSize: '3.5rem', fontWeight: 800, margin: 0,
          color: netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
        }}>
          {fmt(netProfit)}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          {profitMargin}% profit margin
        </p>
      </div>

      {/* Simple Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', margin: '1.5rem 0' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Spent</p>
          <p className="font-tabular" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger-color)' }}>{fmt(totalSpent)}</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Earned</p>
          <p className="font-tabular" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-color)' }}>{fmt(totalRevenue)}</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Expenses</p>
          <p className="font-tabular" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{fmt(totalExpenses)}</p>
        </div>
      </div>

      {/* Profit per Item Chart */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3>Profit by Product</h3>
          <button className="btn btn-primary" onClick={exportReport} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>📥 Export Report</button>
        </div>
        {profitData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, profitData.length * 40)}>
            <BarChart data={profitData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-main)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                formatter={(value) => [`₹${value.toFixed(0)}`, 'Profit']}
              />
              <Bar dataKey="profit" radius={[0, 8, 8, 0]} barSize={24}>
                {profitData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Add some purchases and sales to see profit breakdown.</p>
        )}
      </div>
    </div>
  );
}
