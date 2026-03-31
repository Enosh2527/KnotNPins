import { useState, useEffect, useRef } from 'react';
import { getSettings, updateSettings } from '../services/db';
import toast from 'react-hot-toast';

// A beautifully styled tag input component
const TagEditor = ({ title, description, tags, onChange }) => {
  const [inputVal, setInputVal] = useState('');
  
  const handleAdd = (e) => {
    e.preventDefault();
    const val = inputVal.trim();
    if (!val) return;
    if (tags.includes(val)) {
      toast.error(`${val} already exists`);
      return;
    }
    onChange([...tags, val]);
    setInputVal('');
  };

  const handleRemove = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--card-bg)' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{description}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {tags.map((tag, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg, rgba(207,181,59,0.1), rgba(207,181,59,0.05))',
            border: '1px solid rgba(207,181,59,0.3)', color: 'var(--text-main)',
            padding: '4px 10px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 500
          }}>
            {tag}
            <button 
              onClick={() => handleRemove(i)}
              style={{
                background: 'none', border: 'none', color: 'var(--danger-color)', 
                cursor: 'pointer', padding: '0 2px', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Remove"
            >×</button>
          </span>
        ))}
        {tags.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No items.</span>}
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          className="form-control"
          placeholder={`Add new ${title.toLowerCase()}...`}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="custom-button secondary" style={{ padding: '0 1rem' }}>
          Add
        </button>
      </form>
    </div>
  );
};

export default function SettingsView() {
  const [settings, setSettings] = useState({
    salesSources: [],
    paymentMethods: [],
    expenseCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getSettings();
        setSettings({
          salesSources: data.salesSources || [],
          paymentMethods: data.paymentMethods || [],
          expenseCategories: data.expenseCategories || []
        });
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (field, newTags) => {
    setSettings(prev => ({ ...prev, [field]: newTags }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings synced and saved!', { icon: '✨' });
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>System Configuration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Customize the drop-down options that appear across the platform.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="custom-button primary"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
            color: 'white', minWidth: '120px'
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <TagEditor 
        title="Sales Sources" 
        description="Platforms, physical stalls, or offline locations where you make sales."
        tags={settings.salesSources}
        onChange={(t) => handleChange('salesSources', t)}
      />

      <TagEditor 
        title="Payment Methods" 
        description="How customers pay you (e.g. UPI, Cash, Card)."
        tags={settings.paymentMethods}
        onChange={(t) => handleChange('paymentMethods', t)}
      />

      <TagEditor 
        title="Expense Categories" 
        description="Categorize your business expenses for accurate flow charts."
        tags={settings.expenseCategories}
        onChange={(t) => handleChange('expenseCategories', t)}
      />

    </div>
  );
}
