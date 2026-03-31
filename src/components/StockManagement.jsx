import { useState, useEffect, useRef } from 'react';
import { getPurchases, addPurchase, deletePurchase } from '../services/db';
import toast from 'react-hot-toast';
import AnimatedList from './AnimatedList';
import * as XLSX from 'xlsx';

export default function StockManagement() {
  const [purchases, setPurchases] = useState([]);
  const [entryMode, setEntryMode] = useState('single'); // 'single' | 'bulk'
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemName: '',
    quantity: '',
    unitCost: '',
    sellingPricePerUnit: ''
  });

  const loadData = () => {
    getPurchases().then(setPurchases).catch(() => toast.error('Failed to load purchases.'));
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.quantity || !formData.unitCost || !formData.sellingPricePerUnit) return;
    
    const q = parseFloat(formData.quantity) || 0;
    const c = parseFloat(formData.unitCost) || 0;

    addPurchase({
      ...formData,
      totalCost: (q * c).toFixed(2)
    }).then(saved => {
      setPurchases([...purchases, saved]);
      toast.success('Item added!');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        itemName: '',
        quantity: '',
        unitCost: '',
        sellingPricePerUnit: ''
      });
    }).catch(() => toast.error('Failed to save.'));
  };

  const handleDelete = (item) => {
    deletePurchase(item.id).then(() => {
      setPurchases(purchases.filter(p => p.id !== item.id));
      toast.success('Removed!', { icon: '🗑️' });
    }).catch(() => toast.error('Try again.'));
  };

  /* ─── BULK UPLOAD ─── */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows || rows.length < 2) {
          toast.error('File appears empty or has no data rows.');
          return;
        }

        const parsed = [];

        // ── Pass 1: Try header-based column detection ──
        const headerRow = rows[0];
        const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        const headerMap = { item: -1, qty: -1, unitCost: -1, salePrice: -1, purchasedPrice: -1 };

        if (Array.isArray(headerRow)) {
          headerRow.forEach((cell, idx) => {
            const n = normalize(cell);
            if (['itemname', 'productname', 'item', 'name', 'product'].includes(n)) headerMap.item = idx;
            else if (['quantity', 'qty'].includes(n)) headerMap.qty = idx;
            else if (['unitcost', 'costperunit', 'buyprice', 'perpieceprice', 'perpiecost', 'buypriceperpc', 'costprice', 'purchaseprice', 'cp'].includes(n)) headerMap.unitCost = idx;
            else if (['saleprice', 'sellingprice', 'sellprice', 'sellpriceperpc', 'sp', 'sellingpriceperunit', 'mrp', 'price'].includes(n)) headerMap.salePrice = idx;
            else if (['purchasedprice', 'totalcost', 'totalamount', 'totalpurchase', 'total', 'amount'].includes(n)) headerMap.purchasedPrice = idx;
          });
        }

        const hasHeaders = headerMap.item >= 0 && headerMap.qty >= 0;

        if (hasHeaders) {
          // ── Header-based parsing ──
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            const itemName = row[headerMap.item];
            const qty = row[headerMap.qty];
            if (!itemName || qty === undefined || qty === null || qty === '') continue;

            const unitCost = headerMap.unitCost >= 0 ? row[headerMap.unitCost] : 0;
            const salePrice = headerMap.salePrice >= 0 ? row[headerMap.salePrice] : '';
            const purchasedPrice = headerMap.purchasedPrice >= 0 ? row[headerMap.purchasedPrice] : '';

            parsed.push({
              itemName: String(itemName).replace(/^\d+[\.\)\s]+/, '').trim(),
              quantity: String(Number(qty) || 0),
              unitCost: String(Number(unitCost) || 0),
              sellingPricePerUnit: salePrice !== '' && salePrice !== null && salePrice !== undefined ? String(Number(salePrice) || 0) : '',
              purchasedPrice: purchasedPrice !== '' && purchasedPrice !== null && purchasedPrice !== undefined ? String(Number(purchasedPrice) || 0) : '',
              date: new Date().toISOString().split('T')[0],
              include: true
            });
          }
        } else {
          // ── Fallback: Auto-detect columns (original logic) ──
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            let itemNameVal = null, qtyVal = null, costVal = null, extraNums = [];

            for (const cell of row) {
              if (typeof cell === 'string' && cell.trim().length > 1 && !itemNameVal) {
                itemNameVal = cell.replace(/^\d+[\.\)\s]+/, '').trim();
              } else if (typeof cell === 'number') {
                if (qtyVal === null) qtyVal = cell;
                else if (costVal === null) costVal = cell;
                else extraNums.push(cell);
              }
            }

            if (itemNameVal && qtyVal !== null) {
              parsed.push({
                itemName: itemNameVal,
                quantity: String(qtyVal),
                unitCost: String(costVal || 0),
                sellingPricePerUnit: extraNums.length >= 1 ? String(extraNums[0]) : '',
                purchasedPrice: extraNums.length >= 2 ? String(extraNums[1]) : '',
                date: new Date().toISOString().split('T')[0],
                include: true
              });
            }
          }
        }

        if (parsed.length === 0) {
          toast.error('No valid rows found. Ensure columns: Item Name, Qty, Cost');
          return;
        }

        setBulkPreview(parsed);
        toast.success(`Found ${parsed.length} items!`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse file. Use .xlsx or .csv format.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const toggleBulkItem = (index) => {
    setBulkPreview(prev => prev.map((item, i) => i === index ? { ...item, include: !item.include } : item));
  };

  const updateBulkItem = (index, field, value) => {
    setBulkPreview(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleBulkSubmit = async () => {
    const items = bulkPreview.filter(i => i.include);
    if (items.length === 0) return toast.error('No items selected.');

    setBulkUploading(true);
    let success = 0;
    const newPurchases = [];

    for (const item of items) {
      try {
        const q = parseFloat(item.quantity) || 0;
        const c = parseFloat(item.unitCost) || 0;
        const pp = parseFloat(item.purchasedPrice);
        // Use explicit purchased price if given, else compute from qty × unit cost
        const totalCost = (!isNaN(pp) && pp > 0) ? pp : (q * c);
        const saved = await addPurchase({
          date: item.date,
          itemName: item.itemName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          sellingPricePerUnit: item.sellingPricePerUnit || '0',
          totalCost: totalCost.toFixed(2)
        });
        newPurchases.push(saved);
        success++;
      } catch (err) {
        console.error(`Failed: ${item.itemName}`, err);
      }
    }

    setPurchases(prev => [...prev, ...newPurchases]);
    setBulkPreview([]);
    setBulkUploading(false);
    toast.success(`${success} items imported!`, { icon: '📦' });
  };

  const renderPurchaseItem = (p, index, isSelected) => {
    const margin = ((Number(p.sellingPricePerUnit) - Number(p.unitCost)) / Number(p.unitCost) * 100) || 0;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>{p.itemName}</h4>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {p.date} · Qty: {p.quantity}
          </p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Buy: <b className="font-tabular">₹{p.unitCost}</b>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--success-color)', fontWeight: 600 }}>
              Sell: <b className="font-tabular">₹{p.sellingPricePerUnit || '—'}</b>
            </div>
            {margin > 0 && (
              <span style={{
                display: 'inline-block', marginTop: '2px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)',
                padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700
              }}>
                +{margin.toFixed(0)}% margin
              </span>
            )}
          </div>
          {isSelected && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '0.4rem 0.65rem', cursor: 'pointer',
                color: 'var(--danger-color)', fontSize: '0.75rem', fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="card">
        {/* ═══ MODE TABS ═══ */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[['single', '✏️ Single Entry'], ['bulk', '📤 Bulk Upload']].map(([mode, label]) => (
            <button key={mode} onClick={() => { setEntryMode(mode); setBulkPreview([]); }} style={{
              padding: '0.55rem 1.25rem', borderRadius: '50px', border: 'none',
              background: entryMode === mode ? '#1E1F24' : 'var(--surface-color)',
              color: entryMode === mode ? '#F8F6F1' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: entryMode === mode ? '0 0 12px rgba(227,175,27,0.15)' : 'var(--shadow-sm)',
              transition: 'all 0.25s ease'
            }}>{label}</button>
          ))}
        </div>

        {entryMode === 'single' ? (
          /* ═══ SINGLE ENTRY FORM ═══ */
          <>
            <h3 style={{ marginBottom: '1rem' }}>Add New Stock</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input type="text" className="form-control" name="itemName" value={formData.itemName} onChange={handleChange} placeholder="e.g. Butterfly Clip, Charms" required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label className="form-label">Qty</label>
                  <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" />
                </div>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Buy Price (₹/pc)</label>
                  <input type="number" className="form-control" name="unitCost" value={formData.unitCost} onChange={handleChange} required min="0" step="0.01" placeholder="What you paid" />
                </div>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">Sell Price (₹/pc)</label>
                  <input type="number" className="form-control" name="sellingPricePerUnit" value={formData.sellingPricePerUnit} onChange={handleChange} required min="0" step="0.01" placeholder="What you'll charge" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>+ Add Item</button>
            </form>
          </>
        ) : (
          /* ═══ BULK UPLOAD ═══ */
          <>
            <h3 style={{ marginBottom: '0.5rem' }}>Bulk Upload from Excel</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Upload .xlsx or .csv with columns: <b>Item Name</b>, <b>Quantity</b>, <b>Cost per unit</b>, <b>Sale Price</b>, <b>Purchased Price</b> (total)
            </p>

            {bulkPreview.length === 0 ? (
              /* ─── Drop Zone ─── */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(227,175,27,0.3)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'rgba(227,175,27,0.3)';
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInputRef.current.files = dt.files;
                    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
                style={{
                  border: '2px dashed rgba(227,175,27,0.3)',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(227,175,27,0.02)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📂</div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  Drop your Excel file here
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  or click to browse · .xlsx, .xls, .csv
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              /* ─── Preview Table ─── */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {bulkPreview.filter(i => i.include).length} of {bulkPreview.length} items selected
                  </p>
                  <button onClick={() => setBulkPreview([])} style={{
                    fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer',
                    background: 'none', border: 'none', textDecoration: 'underline'
                  }}>Clear</button>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(227,175,27,0.06)', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buy ₹/pc</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sell ₹/pc</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total ₹</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((item, i) => {
                        const q = parseFloat(item.quantity) || 0;
                        const c = parseFloat(item.unitCost) || 0;
                        const pp = parseFloat(item.purchasedPrice);
                        const computedTotal = (!isNaN(pp) && pp > 0) ? pp : (q * c);
                        return (
                        <tr key={i} style={{
                          borderBottom: '1px solid var(--border-color)',
                          opacity: item.include ? 1 : 0.4,
                          transition: 'opacity 0.2s ease'
                        }}>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <input type="checkbox" checked={item.include} onChange={() => toggleBulkItem(i)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-color)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{item.itemName}</td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.quantity} onChange={(e) => updateBulkItem(i, 'quantity', e.target.value)}
                              style={{ width: '50px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.unitCost} onChange={(e) => updateBulkItem(i, 'unitCost', e.target.value)}
                              style={{ width: '60px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.sellingPricePerUnit} onChange={(e) => updateBulkItem(i, 'sellingPricePerUnit', e.target.value)}
                              placeholder="—" style={{ width: '60px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.purchasedPrice} onChange={(e) => updateBulkItem(i, 'purchasedPrice', e.target.value)}
                              placeholder={computedTotal > 0 ? computedTotal.toFixed(0) : '—'}
                              style={{ width: '70px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleBulkSubmit}
                  disabled={bulkUploading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem', opacity: bulkUploading ? 0.6 : 1 }}
                >
                  {bulkUploading ? '⏳ Importing...' : `📦 Import ${bulkPreview.filter(i => i.include).length} Items`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Your Stock</h3>
        {purchases.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No items yet. Add your first product above!</p>
        ) : (
          <div style={{ height: Math.min(purchases.length * 85, 420) }}>
            <AnimatedList
              items={purchases}
              renderItem={renderPurchaseItem}
              onItemSelect={handleDelete}
              showGradients={purchases.length > 5}
              enableArrowNavigation={true}
              displayScrollbar={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
