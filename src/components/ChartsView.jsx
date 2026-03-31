import { useState, useEffect } from 'react';
import { getPurchases, getSales, getExpenses } from '../services/db';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const Skeleton = ({ w = '100%', h = '1.5rem' }) => (
  <div style={{
    width: w, height: h, borderRadius: '8px',
    background: 'linear-gradient(90deg, var(--border-color) 25%, rgba(255,255,255,0.4) 50%, var(--border-color) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  }} />
);

export default function ChartsView() {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        const [p, s, e] = await Promise.all([getPurchases(), getSales(), getExpenses()]);
        
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

        setSalesData(filterByDate(s));
        setExpensesData(filterByDate(e));
      } catch (err) {
        console.error("Charts load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filter]);

  // Chart data builders
  const buildTrendData = () => {
    const aggr = {};
    salesData.forEach(s => {
      const d = s.date;
      if (!aggr[d]) aggr[d] = { date: d.substring(5), Revenue: 0, Expenses: 0, Profit: 0 };
      aggr[d].Revenue += Number(s.sellingPrice) * Number(s.quantity);
    });
    expensesData.forEach(e => {
      const d = e.date;
      if (!aggr[d]) aggr[d] = { date: d.substring(5), Revenue: 0, Expenses: 0, Profit: 0 };
      aggr[d].Expenses += Number(e.amount);
    });
    return Object.values(aggr).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d, Profit: d.Revenue - d.Expenses
    }));
  };

  const buildSourcePie = () => {
    const aggr = {};
    salesData.forEach(s => {
      const source = s.source || 'Offline';
      aggr[source] = (aggr[source] || 0) + (Number(s.sellingPrice) * Number(s.quantity));
    });
    const total = Object.values(aggr).reduce((s, v) => s + v, 0);
    return Object.entries(aggr)
      .map(([name, value]) => ({ name, value, pct: total > 0 ? ((value / total) * 100).toFixed(0) : 0 }))
      .sort((a, b) => b.value - a.value);
  };

  const buildExpensesPie = () => {
    const aggr = {};
    expensesData.forEach(e => { aggr[e.category] = (aggr[e.category] || 0) + Number(e.amount); });
    const total = Object.values(aggr).reduce((s, v) => s + v, 0);
    return Object.entries(aggr)
      .map(([name, value]) => ({ name, value, pct: total > 0 ? ((value / total) * 100).toFixed(0) : 0 }))
      .sort((a, b) => b.value - a.value);
  };

  const buildTopItems = () => {
    const aggr = {};
    salesData.forEach(s => {
      aggr[s.itemSold] = (aggr[s.itemSold] || 0) + (Number(s.sellingPrice) * Number(s.quantity));
    });
    return Object.entries(aggr)
      .map(([name, Revenue]) => ({ name, Revenue }))
      .sort((a, b) => b.Revenue - a.Revenue)
      .slice(0, 5); // Top 5
  };

  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
  const SOURCE_COLORS = { 'Online': '#3b82f6', 'Offline': '#6b7280', 'Stall 1': '#f59e0b', 'Stall 2': '#ec4899', 'Stall 3': '#8b5cf6' };
  
  const getSourceColor = (name, index) => SOURCE_COLORS[name] || COLORS[index % COLORS.length];

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  
  const trendData = buildTrendData();
  const sourcePie = buildSourcePie();
  const expPie = buildExpensesPie();
  const topItems = buildTopItems();

  const totalRev = salesData.reduce((sum, s) => sum + (Number(s.sellingPrice) * Number(s.quantity)), 0);
  const totalExp = expensesData.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="animate-fade-in pb-20">
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ═══ FILTER PILLS ═══ */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Analytics & Charts</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[['all','All Time'],['yearly','This Year'],['monthly','This Month'],['daily','Today']].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '0.4rem 1rem', borderRadius: '50px', border: 'none',
              background: filter === k ? 'var(--primary-color)' : 'var(--surface-color)',
              color: filter === k ? '#fff' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
              boxShadow: filter === k ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
              transition: 'all 0.25s ease'
            }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ padding: '1.5rem' }}><Skeleton h="200px" /></div>)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Revenue & Expenses Trend */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>Revenue & Expenses Flow</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Financial trajectory over time</p>
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTrendRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gTrendExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.95)' }}
                    formatter={(v) => `₹${v.toFixed(0)}`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gTrendRev)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#gTrendExp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.85rem' }}>No financial data found.</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Sales by Source */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>Sales by Source</h3>
              {sourcePie.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                        {sourcePie.map((entry, i) => <Cell key={`c-${i}`} fill={getSourceColor(entry.name, i)} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} 
                        formatter={(v,name) => [`₹${v.toFixed(0)}`, name]} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ width: '100%', marginTop: '1rem' }}>
                    {sourcePie.map((s, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: getSourceColor(s.name, i) }} />
                          <span style={{ fontSize: '0.85rem' }}>{s.name}</span>
                        </div>
                        <span className="font-tabular" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(s.value)} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({s.pct}%)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No sales sources tracked.</p>}
            </div>

            {/* Expenses Breakdown */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>Expenses Breakdown</h3>
              {expPie.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={expPie} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                        {expPie.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }} 
                        formatter={(v,name) => [`₹${v.toFixed(0)}`, name]} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ width: '100%', marginTop: '1rem' }}>
                    {expPie.map((e, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontSize: '0.85rem' }}>{e.name}</span>
                        </div>
                        <span className="font-tabular" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(e.value)} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({e.pct}%)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.85rem' }}>No expenses logged.</p>}
            </div>
          </div>

          {/* Top Products Bar Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>Top Performing Items</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Highest revenue generating products</p>
            </div>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topItems} layout="vertical" margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-main)', fontSize: 11, width: 90 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                    formatter={(val) => `₹${val.toFixed(0)}`}
                  />
                  <Bar dataKey="Revenue" radius={[0, 8, 8, 0]} barSize={24} fill="var(--primary-color)">
                    {topItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'var(--primary-color)'} opacity={1 - (index * 0.15)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.85rem' }}>No sales data for products.</p>}
          </div>

        </div>
      )}
    </div>
  );
}
