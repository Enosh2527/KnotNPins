import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './components/Dashboard';
import StockManagement from './components/StockManagement';
import SalesTracker from './components/SalesTracker';
import ExpenseLog from './components/ExpenseLog';
import InventoryStatus from './components/InventoryStatus';
import DataImport from './components/DataImport';
import ProfitView from './components/ProfitView';
import ChartsView from './components/ChartsView';
import SettingsView from './components/SettingsView';
import { seedDummyData } from './services/db';
import { Toaster } from 'react-hot-toast';
import PullToRefresh from 'react-simple-pull-to-refresh';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showQuickSale, setShowQuickSale] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    if (isAuthenticated) {
      seedDummyData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in a form field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        setActiveTab('sales');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      } else if (key === 'e') {
        e.preventDefault();
        setActiveTab('expenses');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
      }
    };
    
    if (isAuthenticated) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isAuthenticated]);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />
      case 'stock':
        return <StockManagement />
      case 'sales':
        return <SalesTracker />
      case 'expenses':
        return <ExpenseLog />
      case 'inventory':
        return <InventoryStatus />
      case 'import':
        return <DataImport />
      case 'profit':
        return <ProfitView />
      case 'charts':
        return <ChartsView />
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />
    }
  }

  const handleRefresh = async () => {
    // A simple reload properly re-fetches all underlying DB data for the active view
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />
        <Login onLogin={() => setIsAuthenticated(true)} />
      </>
    );
  }

  return (
    <div className="app-container">
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />
      
      {/* Mobile/Desktop Navigation Area */}
      <nav className="bottom-nav">
        <ul>
          <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📊</span>
            Dashboard
          </li>
          <li className={activeTab === 'stock' ? 'active' : ''} onClick={() => setActiveTab('stock')}>
            <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📦</span>
            Purchases
          </li>
          <li className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
            <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>🛍️</span>
            Sales
          </li>
          <li className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}>
            <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💸</span>
            Expenses
          </li>
          <li className={activeTab === 'profit' ? 'active' : ''} onClick={() => setActiveTab('profit')}>
            <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>💰</span>
            Profit
          </li>
          <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => {
            const pwd = window.prompt('Enter admin password to access Settings');
            if (pwd === 'admin123') setActiveTab('settings');
            else alert('Incorrect password');
          }}>
            <span style={{ fontSize: '1.25rem', marginBottom: '4px' }}>⚙️</span>
            Settings
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <PullToRefresh onRefresh={handleRefresh} style={{ minHeight: '100%' }}>
          <header className="page-header">
            <div>
              <h1>Knot & Pins</h1>
              <p className="subtitle">Inventory & Expense Manager</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="logo-badge">
                <img src="/logo.png" alt="Knot & Pins" />
              </div>
              <button className="theme-toggle" onClick={() => setIsDarkTheme(!isDarkTheme)} title="Toggle Dark Mode">
                {isDarkTheme ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          {renderView()}
        </PullToRefresh>
      </main>

      {/* Floating Action Button */}
      <button 
        className="fab"
        onClick={() => {
          setActiveTab('sales'); 
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }}
        title="Quick Sale"
        style={{
          position: 'fixed', bottom: 'calc(var(--nav-height) + 20px)', right: '20px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #cfb53b, #d4af37)', color: '#fff',
          boxShadow: '0 4px 15px rgba(207, 181, 59, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', zIndex: 90, cursor: 'pointer', border: 'none'
        }}
      >
        +
      </button>

    </div>
  )
}

export default App
