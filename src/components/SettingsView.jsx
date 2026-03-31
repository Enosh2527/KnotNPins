import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/db';
import toast from 'react-hot-toast';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    salesSources: [],
    paymentMethods: [],
    expenseCategories: []
  });
  const [loading, setLoading] = useState(true);

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

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(settings);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return <p style={{ padding: '1rem' }}>Loading settings...</p>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Admin Customization Settings</h2>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3>Sales Sources</h3>
        <textarea
          rows={3}
          style={{ width: '100%', fontFamily: 'monospace' }}
          value={settings.salesSources.join('\n')}
          onChange={e => handleChange('salesSources', e.target.value.split('\n').filter(v => v.trim()))}
        />
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3>Payment Methods</h3>
        <textarea
          rows={3}
          style={{ width: '100%', fontFamily: 'monospace' }}
          value={settings.paymentMethods.join('\n')}
          onChange={e => handleChange('paymentMethods', e.target.value.split('\n').filter(v => v.trim()))}
        />
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <h3>Expense Categories</h3>
        <textarea
          rows={4}
          style={{ width: '100%', fontFamily: 'monospace' }}
          value={settings.expenseCategories.join('\n')}
          onChange={e => handleChange('expenseCategories', e.target.value.split('\n').filter(v => v.trim()))}
        />
      </section>

      <button
        onClick={handleSave}
        style={{
          background: 'linear-gradient(135deg, #cfb53b, #b09a31)',
          color: '#fff',
          border: 'none',
          padding: '0.6rem 1.2rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Save Settings
      </button>
    </div>
  );
}
