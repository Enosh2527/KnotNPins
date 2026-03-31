import { useState, useEffect } from 'react';
import { calculateFinancials } from '../utils/calculations';
import { getPurchases, getSales, getExpenses } from '../services/db';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

/* ── Skeleton Loader ── */
const Skeleton = ({ w = '100%', h = '1.5rem' }) => (
  <div style={{
    width: w, height: h, borderRadius: '8px',
    background: 'linear-gradient(90deg, var(--border-color) 25%, rgba(255,255,255,0.4) 50%, var(--border-color) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  }} />
);

/* ── Trend Badge ── */
const Trend = ({ value, inverse = false }) => {
  if (!value || value === 0 || !isFinite(value)) return null;
  const up = value > 0;
  const good = inverse ? !up : up;
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '50px',
      background: good ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      color: good ? 'var(--success-color)' : 'var(--danger-color)',
      display: 'inline-flex', alignItems: 'center', gap: '2px'
    }}>
      {up ? '↑' : '↓'}{Math.abs(value).toFixed(1)}%
    </span>
  );
};

export default function Dashboard({ onNavigate }) {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('revenue');
  const [financials, setFinancials] = useState({
    totalInvestment: 0, totalSalesRevenue: 0, totalExpenses: 0, netProfit: 0,
    trends: { investment: 0, sales: 0, expenses: 0, profit: 0 }
  });
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [purchasesData, setPurchasesData] = useState([]);

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        const [p, s, e] = await Promise.all([getPurchases(), getSales(), getExpenses()]);
        setPurchasesData(p);
        
        const filterByDate = (items) => {
          if (filter === 'all') return items;
          const now = new Date();
          return items.filter(item => {
            const d = new Date(item.date);
            if (filter === 'daily') return d.toDateString() === now.toDateString();
            if (filter === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (filter === 'yearly') return d.getFullYear() === now.getFullYear();
            return true;
          });
        };

        const fs = filterByDate(s);
        const fe = filterByDate(e);
        setSalesData(fs);
        setExpensesData(fe);
        setFinancials(calculateFinancials(p, s, e, filter));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filter]);

  // Chart data builders
  const buildChartData = () => {
    const aggr = {};
    salesData.forEach(s => {
      const d = s.date;
      if (!aggr[d]) aggr[d] = { date: d.substring(5), revenue: 0, expenses: 0 };
      aggr[d].revenue += Number(s.sellingPrice) * Number(s.quantity);
    });
    expensesData.forEach(e => {
      const d = e.date;
      if (!aggr[d]) aggr[d] = { date: d.substring(5), revenue: 0, expenses: 0 };
      aggr[d].expenses += Number(e.amount);
    });
    return Object.values(aggr).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, profit: d.revenue - d.expenses
    }));
  };

  const buildExpensesPie = () => {
    const aggr = {};
    expensesData.forEach(e => { aggr[e.category] = (aggr[e.category] || 0) + Number(e.amount); });
    const total = Object.values(aggr).reduce((s, v) => s + v, 0);
    return Object.entries(aggr).map(([name, value]) => ({ name, value, pct: total > 0 ? ((value / total) * 100).toFixed(0) : 0 }));
  };

  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const chartData = buildChartData();
  const expPie = buildExpensesPie();
  const expTotal = expensesData.reduce((s, e) => s + Number(e.amount), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in">
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(227,175,27,0.06), rgba(185,124,109,0.04))',
        borderRadius: '22px', padding: '1.75rem', marginBottom: '1.5rem',
        border: '1px solid rgba(227,175,27,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>{greeting}, Admin 👋</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track revenue, expenses, and inventory in one place.</p>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ═══ BENTO QUICK ACTIONS ═══ */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.85rem' }}>Quick Actions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: '🛍️', title: 'Add Sale', desc: 'Record a new sale', tab: 'sales' },
            { icon: '💸', title: 'Add Expense', desc: 'Track expenses', tab: 'expenses' },
            { icon: '📦', title: 'Add Stock', desc: 'Update inventory', tab: 'stock' },
            { icon: '💰', title: 'Profit Report', desc: 'View profit/loss', tab: 'profit' },
            { icon: '🚨', title: 'Low Stock', desc: 'Check stock alerts', tab: 'inventory' },
            { icon: '📊', title: 'Analytics', desc: 'Business trends', tab: 'dashboard' },
          ].map((action) => (
            <button
              key={action.tab + action.title}
              onClick={() => onNavigate && onNavigate(action.tab)}
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(227,175,27,0.15)',
                borderRadius: '16px',
                padding: '1.15rem 1rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(227,175,27,0.15), 0 8px 25px rgba(0,0,0,0.3)';
                e.currentTarget.style.borderColor = 'rgba(227,175,27,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(227,175,27,0.15)';
              }}
            >
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>{action.icon}</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8F6F1', margin: 0, marginBottom: '0.15rem' }}>{action.title}</p>
              <p style={{ fontSize: '0.7rem', color: '#8b8d95', margin: 0 }}>{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ FILTER PILLS ═══ */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[['all','All Time'],['yearly','This Year'],['monthly','This Month'],['daily','Today']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '0.5rem 1.25rem', borderRadius: '50px', border: 'none',
            background: filter === k ? 'var(--primary-color)' : 'var(--surface-color)',
            color: filter === k ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            boxShadow: filter === k ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
            transition: 'all 0.25s ease'
          }}>{l}</button>
        ))}
      </div>

      {/* ═══ KPI CARDS ═══ */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="card" style={{ padding: '1.5rem' }}><Skeleton h="0.7rem" w="60%" /><div style={{ height: '0.5rem' }} /><Skeleton h="2rem" w="80%" /></div>)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Invested', val: financials.totalInvestment, trend: financials.trends.investment, inverse: true, color: 'var(--text-main)' },
            { label: 'Revenue', val: financials.totalSalesRevenue, trend: financials.trends.sales, color: 'var(--success-color)' },
            { label: 'Expenses', val: financials.totalExpenses, trend: financials.trends.expenses, inverse: true, color: 'var(--danger-color)' },
          ].map(c => (
            <div key={c.label} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{c.label}</p>
                <Trend value={c.trend} inverse={c.inverse} />
              </div>
              <p className="font-tabular" style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{fmt(c.val)}</p>
            </div>
          ))}
          <div className="card" style={{
            padding: '1.25rem',
            background: financials.netProfit >= 0
              ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(255,255,255,0.9))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(255,255,255,0.9))',
            border: `1px solid ${financials.netProfit >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            boxShadow: financials.netProfit >= 0 ? '0 0 20px rgba(16,185,129,0.15)' : '0 0 20px rgba(239,68,68,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {financials.netProfit >= 0 ? '✨ Profit' : '⚠️ Loss'}
              </p>
              <Trend value={financials.trends.profit} />
            </div>
            <p className="font-tabular" style={{ fontSize: '1.5rem', fontWeight: 800, color: financials.netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>{fmt(financials.netProfit)}</p>
          </div>
        </div>
      )}

      {/* ═══ REVENUE / PROFIT CHART ═══ */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem' }}>Performance</h3>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[['revenue','Revenue'],['profit','Profit'],['expenses','Expenses']].map(([k,l]) => (
              <button key={k} onClick={() => setChartMode(k)} style={{
                padding: '0.3rem 0.75rem', borderRadius: '50px', border: 'none',
                background: chartMode === k ? 'var(--primary-color)' : 'transparent',
                color: chartMode === k ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
              }}>{l}</button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E4AA06" stopOpacity={0.35}/><stop offset="95%" stopColor="#E4AA06" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.95)' }}
                formatter={(v) => [`₹${v.toFixed(0)}`, chartMode.charAt(0).toUpperCase() + chartMode.slice(1)]}
              />
              <Area type="monotone" dataKey={chartMode} stroke={chartMode === 'revenue' ? '#E4AA06' : chartMode === 'profit' ? '#10b981' : '#ef4444'} strokeWidth={2.5} fillOpacity={1} fill={`url(#g${chartMode.charAt(0).toUpperCase() + chartMode.slice(1)})`} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Add sales & expenses to see trends</p>}
      </div>

      {/* ═══ WHERE MONEY GOES — DONUT ═══ */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Where Money Goes</h3>
        {expPie.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0, margin: '0 auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {expPie.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} formatter={(v,name) => [`₹${v} (${expPie.find(e=>e.name===name)?.pct}%)`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <p className="font-tabular" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(expTotal)}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>total</p>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              {expPie.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    <span style={{ fontSize: '0.85rem' }}>{e.name}</span>
                  </div>
                  <span className="font-tabular" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>₹{e.value.toFixed(0)} <span style={{ fontSize: '0.7rem' }}>({e.pct}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No expenses logged.</p>}
      </div>
    </div>
  );
}
