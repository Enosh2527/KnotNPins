import { useState, useEffect } from 'react';
import { getExpenses, addExpense, deleteExpense, getSettings } from '../services/db';
import toast from 'react-hot-toast';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

export default function ExpenseLog() {
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState({ expenseCategories: ['Travel', 'Food', 'Packaging', 'Other'] });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Travel',
    amount: '',
    description: ''
  });

  const loadData = () => {
    getExpenses().then(setExpenses).catch(() => toast.error('Failed to load expenses'));
    getSettings().then(data => {
      setSettings({
        expenseCategories: data.expenseCategories?.length ? data.expenseCategories : ['Travel', 'Food', 'Packaging', 'Other']
      });
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    
    addExpense(formData).then(saved => {
      setExpenses([...expenses, saved]);
      toast.success('Expense recorded securely!');
      setFormData({
        ...formData,
        amount: '',
        description: ''
      });
    }).catch(() => toast.error('Failed to save expense.'));
  };

  const handleDelete = (id) => {
    deleteExpense(id).then(() => {
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Expense deleted.', { icon: '🗑️' });
    }).catch(() => toast.error('Failed to delete right now.'));
  };

  return (
    <div className="animate-fade-in expense-container">
      <div className="card">
        <h3>Log Operational Cost</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 150px' }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group" style={{ flex: '1 1 150px' }}>
              <label className="form-label">Category</label>
              <select className="form-control" name="category" value={formData.category} onChange={handleChange} required>
                {settings.expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 100px' }}>
              <label className="form-label">Amount</label>
              <input type="number" className="form-control" name="amount" value={formData.amount} onChange={handleChange} required min="0" step="0.01" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input type="text" className="form-control" name="description" value={formData.description} onChange={handleChange} required placeholder="e.g. Auto fare to market" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>+ Add Expense</button>
        </form>
      </div>

      <div className="card" style={{ padding: '1rem 0' }}>
        <h3 style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>Expense History
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
            👈 Swipe to delete
          </span>
        </h3>
        
        {expenses.length === 0 ? (
           <p style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>No expenses logged yet.</p>
        ) : (
          <SwipeableList>
            {expenses.map(e => (
              <SwipeableListItem
                key={e.id}
                trailingActions={
                  <TrailingActions>
                    <SwipeAction onClick={() => handleDelete(e.id)} destructive={true}>
                      <div style={{ 
                        background: 'var(--danger-color)', color: 'white', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 1.5rem', fontWeight: 'bold'
                      }}>
                        Delete
                      </div>
                    </SwipeAction>
                  </TrailingActions>
                }
              >
                <div style={{ 
                  width: '100%', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#fff'
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{e.category}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {e.date} <span style={{ opacity: 0.5 }}>|</span> {e.description}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--danger-color)' }}>
                    -₹{e.amount}
                  </div>
                </div>
              </SwipeableListItem>
            ))}
          </SwipeableList>
        )}
      </div>
    </div>
  );
}
