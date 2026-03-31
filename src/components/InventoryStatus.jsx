import { useState, useEffect } from 'react';
import { getPurchases, getSales } from '../services/db';
import { calculateInventory } from '../utils/calculations';
import { exportDataToExcel } from '../utils/export';

export default function InventoryStatus() {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const [purchases, sales] = await Promise.all([getPurchases(), getSales()]);
        const inv = calculateInventory(purchases, sales);
        setInventory(inv);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      }
    };
    loadInventory();
  }, []);

  return (
    <div className="animate-fade-in inventory-container">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3>Current Stock Levels</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => exportDataToExcel(inventory, 'Inventory', 'KnotAndPins_Inventory')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            📥 Export Excel
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Real-time calculation based on Purchase Logs minus Sales Logs.
        </p>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <th style={{ padding: '1rem 0.5rem', fontFamily: 'var(--font-family-heading)' }}>Product Line</th>
                <th style={{ padding: '1rem 0.5rem', fontFamily: 'var(--font-family-heading)' }}>Purchased</th>
                <th style={{ padding: '1rem 0.5rem', fontFamily: 'var(--font-family-heading)' }}>Sold</th>
                <th style={{ padding: '1rem 0.5rem', fontFamily: 'var(--font-family-heading)' }}>Stock Status</th>
                <th style={{ padding: '1rem 0.5rem', fontFamily: 'var(--font-family-heading)' }}>Avg Cost</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => {
                let badge = null;
                if (item.currentStock <= 5) {
                  badge = <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>🚨 Low Stock</span>;
                } else if (item.currentStock > 20 && item.soldQty < 5) {
                  badge = <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>🧊 Dead Stock</span>;
                } else if (item.soldQty >= 15) {
                  badge = <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>🔥 Trending</span>;
                }

                return (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.itemName}</td>
                    <td className="font-tabular" style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{item.purchasedQty}</td>
                    <td className="font-tabular" style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>{item.soldQty}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span className="font-tabular" style={{
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        color: item.currentStock <= 5 ? 'var(--danger-color)' : 
                               item.currentStock <= 15 ? '#d97706' : 'var(--text-main)'
                      }}>
                        {item.currentStock}
                      </span>
                      {badge}
                    </td>
                    <td className="font-tabular" style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                      ₹{item.avgUnitCost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Start by logging purchases to see your inventory build up here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
