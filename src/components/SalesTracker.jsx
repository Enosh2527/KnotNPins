import { useState, useEffect, useRef } from 'react';
import { getSales, addSale, deleteSale, getPurchases } from '../services/db';
import toast from 'react-hot-toast';
import AnimatedList from './AnimatedList';
import * as XLSX from 'xlsx';

export default function SalesTracker() {
  const [sales, setSales] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [entryMode, setEntryMode] = useState('single'); // 'single' | 'bulk'
  const [bulkPreview, setBulkPreview] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    itemSold: '',
    quantity: '',
    sellingPrice: '',
    paymentMethod: 'UPI',
    source: 'Offline'
  });

  const loadData = () => {
    getSales().then(setSales).catch(() => toast.error('Failed to load sales.'));
    getPurchases().then(purchases => {
      const uniqueItems = [...new Set(purchases.map(p => p.itemName))];
      setAvailableItems(uniqueItems);
    }).catch(console.error);
  };

  useEffect(() => { loadData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemSold || !formData.quantity || !formData.sellingPrice) return;
    
    addSale(formData).then(saved => {
      setSales([...sales, saved]);
      toast.success('Sale logged!');
      setFormData({ ...formData, itemSold: '', quantity: '', sellingPrice: '', source: 'Offline' });
    }).catch(() => toast.error('Failed to log sale.'));
  };

  const handleDelete = (item) => {
    deleteSale(item.id).then(() => {
      setSales(sales.filter(s => s.id !== item.id));
      toast.success('Sale deleted.', { icon: '🗑️' });
    }).catch(() => toast.error('Failed to delete.'));
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

        // ── Header-based column detection ──
        const headerRow = rows[0];
        const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        const headerMap = { item: -1, qty: -1, sellingPrice: -1, paymentMethod: -1, date: -1, totalAmount: -1, source: -1 };

        if (Array.isArray(headerRow)) {
          headerRow.forEach((cell, idx) => {
            const n = normalize(cell);
            if (['itemsold', 'itemname', 'productname', 'item', 'name', 'product'].includes(n)) headerMap.item = idx;
            else if (['quantity', 'qty', 'salesquantity'].includes(n)) headerMap.qty = idx;
            else if (['sellingprice', 'saleprice', 'sellprice', 'priceperunit', 'price', 'sp', 'rate', 'unitprice', 'priceperpc'].includes(n)) headerMap.sellingPrice = idx;
            else if (['totalamount', 'total', 'amount', 'totalrevenue', 'totalsale', 'revenue'].includes(n)) headerMap.totalAmount = idx;
            else if (['paymentmethod', 'method', 'payment', 'mode', 'paymode', 'paymentmode'].includes(n)) headerMap.paymentMethod = idx;
            else if (['date', 'saledate', 'solddate'].includes(n)) headerMap.date = idx;
            else if (['source', 'platform', 'channel', 'origin', 'where'].includes(n)) headerMap.source = idx;
          });
        }

        const hasHeaders = headerMap.item >= 0 && (headerMap.qty >= 0 || headerMap.totalAmount >= 0);

        if (hasHeaders) {
          // ── Header-based parsing ──
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            const itemName = row[headerMap.item];
            if (!itemName) continue;

            const qty = headerMap.qty >= 0 ? row[headerMap.qty] : 1;
            const sellingPrice = headerMap.sellingPrice >= 0 ? row[headerMap.sellingPrice] : '';
            const totalAmount = headerMap.totalAmount >= 0 ? row[headerMap.totalAmount] : '';
            const paymentMethod = headerMap.paymentMethod >= 0 ? (row[headerMap.paymentMethod] || 'Cash') : 'Cash';
            const date = headerMap.date >= 0 ? row[headerMap.date] : '';
            const sourceVal = headerMap.source >= 0 ? (row[headerMap.source] || 'Offline') : 'Offline';

            // If we have total but not per-unit price, compute it
            let pricePerUnit = sellingPrice;
            if ((!pricePerUnit || pricePerUnit === '') && totalAmount && qty) {
              pricePerUnit = Number(totalAmount) / Number(qty);
            }

            parsed.push({
              itemSold: String(itemName).replace(/^\d+[\.\)\s]+/, '').trim(),
              quantity: String(Number(qty) || 1),
              sellingPrice: pricePerUnit !== '' && pricePerUnit !== null && pricePerUnit !== undefined ? String(Number(pricePerUnit) || 0) : '',
              totalAmount: totalAmount !== '' && totalAmount !== null && totalAmount !== undefined ? String(Number(totalAmount) || 0) : '',
              paymentMethod: String(paymentMethod),
              source: String(sourceVal),
              date: date ? String(date) : new Date().toISOString().split('T')[0],
              include: true
            });
          }
        } else {
          // ── Fallback: Auto-detect columns ──
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            let itemNameVal = null, nums = [];

            for (const cell of row) {
              if (typeof cell === 'string' && cell.trim().length > 1 && !itemNameVal) {
                itemNameVal = cell.replace(/^\d+[\.\)\s]+/, '').trim();
              } else if (typeof cell === 'number') {
                nums.push(cell);
              }
            }

            if (itemNameVal && nums.length >= 1) {
              parsed.push({
                itemSold: itemNameVal,
                quantity: String(nums[0] || 1),
                sellingPrice: nums.length >= 2 ? String(nums[1]) : '',
                totalAmount: nums.length >= 3 ? String(nums[2]) : '',
                paymentMethod: 'Cash',
                source: 'Offline',
                date: new Date().toISOString().split('T')[0],
                include: true
              });
            }
          }
        }

        if (parsed.length === 0) {
          toast.error('No valid rows found. Ensure columns: Item Sold, Qty, Price');
          return;
        }

        setBulkPreview(parsed);
        toast.success(`Found ${parsed.length} sales!`);
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

  const updateAllSources = (sourceVal) => {
    if (!sourceVal) return;
    setBulkPreview(prev => prev.map(item => item.include ? { ...item, source: sourceVal } : item));
  };

  const handleBulkSubmit = async () => {
    const items = bulkPreview.filter(i => i.include);
    if (items.length === 0) return toast.error('No items selected.');

    setBulkUploading(true);
    let success = 0;
    const newSales = [];

    for (const item of items) {
      try {
        const q = parseFloat(item.quantity) || 1;
        const sp = parseFloat(item.sellingPrice) || 0;
        const ta = parseFloat(item.totalAmount);
        // If total amount is given, compute sellingPrice as total/qty
        const finalPrice = (!isNaN(ta) && ta > 0) ? (ta / q) : sp;

        const saved = await addSale({
          date: item.date,
          itemSold: item.itemSold,
          quantity: String(q),
          sellingPrice: String(finalPrice.toFixed(2)),
          paymentMethod: item.paymentMethod,
          source: item.source || 'Offline'
        });
        newSales.push(saved);
        success++;
      } catch (err) {
        console.error(`Failed: ${item.itemSold}`, err);
      }
    }

    setSales(prev => [...prev, ...newSales]);
    setBulkPreview([]);
    setBulkUploading(false);
    toast.success(`${success} sales imported!`, { icon: '💰' });
  };

  const renderSaleItem = (s, index, isSelected) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>{s.itemSold}</h4>
        <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {s.date} · Qty: {s.quantity}
        </p>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div>
          <div className="font-tabular" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success-color)' }}>₹{(Number(s.sellingPrice) * Number(s.quantity)).toFixed(0)}</div>
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '3px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-muted)',
              padding: '0.1rem 0.45rem', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 600
            }}>
              {s.source || 'Offline'}
            </span>
            <span style={{
              display: 'inline-block',
              backgroundColor: s.paymentMethod === 'UPI' ? 'rgba(16,185,129,0.1)' : 'rgba(227,175,27,0.1)',
              color: s.paymentMethod === 'UPI' ? 'var(--success-color)' : 'var(--primary-color)',
              padding: '0.1rem 0.45rem', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 600
            }}>
              {s.paymentMethod}
            </span>
          </div>
        </div>
        {isSelected && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(s); }}
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
            <h3 style={{ marginBottom: '1rem' }}>Log a Sale</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 140px' }}>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: '2 1 200px' }}>
                  <label className="form-label">Item Sold</label>
                  {availableItems.length > 0 ? (
                    <select className="form-control" name="itemSold" value={formData.itemSold} onChange={handleChange} required>
                      <option value="" disabled>Select Item</option>
                      {availableItems.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="form-control" name="itemSold" value={formData.itemSold} onChange={handleChange} placeholder="Item Name" required />
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label className="form-label">Qty</label>
                  <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" />
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label className="form-label">Selling Price</label>
                  <input type="number" className="form-control" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} required min="0" step="0.01" />
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label className="form-label">Method</label>
                  <select className="form-control" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label className="form-label">Source</label>
                  <select className="form-control" name="source" value={formData.source} onChange={handleChange}>
                    <option value="Offline">Offline</option>
                    <option value="Online">Online</option>
                    <option value="Stall 1">Stall 1</option>
                    <option value="Stall 2">Stall 2</option>
                    <option value="Stall 3">Stall 3</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>+ Log Sale</button>
            </form>
          </>
        ) : (
          /* ═══ BULK UPLOAD ═══ */
          <>
            <h3 style={{ marginBottom: '0.5rem' }}>Bulk Upload Sales from Excel</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Upload .xlsx or .csv with columns: <b>Item Sold</b>, <b>Quantity</b>, <b>Selling Price</b>, <b>Total Amount</b>, <b>Payment Method</b>, <b>Source</b>
            </p>

            {bulkPreview.length === 0 ? (
              /* ─── Drop Zone ─── */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInputRef.current.files = dt.files;
                    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
                style={{
                  border: '2px dashed rgba(16,185,129,0.3)',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(16,185,129,0.02)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  Drop your Sales Excel file here
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
                    {bulkPreview.filter(i => i.include).length} of {bulkPreview.length} sales selected
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.35rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Apply Source to All:</span>
                      <select onChange={(e) => { updateAllSources(e.target.value); e.target.value = ""; }} defaultValue=""
                        style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '0.78rem', cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
                        <option value="" disabled>Select Source</option>
                        <option value="Offline">Offline</option>
                        <option value="Online">Online</option>
                        <option value="Stall 1">Stall 1</option>
                        <option value="Stall 2">Stall 2</option>
                        <option value="Stall 3">Stall 3</option>
                      </select>
                    </div>
                    <button onClick={() => setBulkPreview([])} style={{
                      fontSize: '0.78rem', color: 'var(--danger-color)', cursor: 'pointer',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', 
                      padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 600, transition: 'all 0.2s ease'
                    }}>Clear Data</button>
                  </div>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(16,185,129,0.06)', position: 'sticky', top: 0 }}>
                        {['✓', 'Item', 'Qty', 'Price ₹/pc', 'Total ₹', 'Method', 'Source'].map(h => (
                          <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: h === 'Item' ? 'left' : 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((item, i) => {
                        const q = parseFloat(item.quantity) || 1;
                        const sp = parseFloat(item.sellingPrice) || 0;
                        const ta = parseFloat(item.totalAmount);
                        const computedTotal = (!isNaN(ta) && ta > 0) ? ta : (q * sp);
                        return (
                        <tr key={i} style={{
                          borderBottom: '1px solid var(--border-color)',
                          opacity: item.include ? 1 : 0.4,
                          transition: 'opacity 0.2s ease'
                        }}>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                            <input type="checkbox" checked={item.include} onChange={() => toggleBulkItem(i)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--success-color)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>{item.itemSold}</td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.quantity} onChange={(e) => updateBulkItem(i, 'quantity', e.target.value)}
                              style={{ width: '50px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.sellingPrice} onChange={(e) => updateBulkItem(i, 'sellingPrice', e.target.value)}
                              placeholder="—" style={{ width: '65px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <input type="number" value={item.totalAmount} onChange={(e) => updateBulkItem(i, 'totalAmount', e.target.value)}
                              placeholder={computedTotal > 0 ? computedTotal.toFixed(0) : '—'}
                              style={{ width: '70px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', fontSize: '0.82rem', background: 'transparent', color: 'var(--text-main)' }} />
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <select value={item.paymentMethod} onChange={(e) => updateBulkItem(i, 'paymentMethod', e.target.value)}
                              style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem 0.3rem', fontSize: '0.78rem', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>
                              <option value="UPI">UPI</option>
                              <option value="Cash">Cash</option>
                              <option value="Card">Card</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <select value={item.source || 'Offline'} onChange={(e) => updateBulkItem(i, 'source', e.target.value)}
                              style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem 0.3rem', fontSize: '0.78rem', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>
                              <option value="Offline">Offline</option>
                              <option value="Online">Online</option>
                              <option value="Stall 1">Stall 1</option>
                              <option value="Stall 2">Stall 2</option>
                              <option value="Stall 3">Stall 3</option>
                            </select>
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
                  style={{ width: '100%', marginTop: '1rem', opacity: bulkUploading ? 0.6 : 1, backgroundColor: '#059669' }}
                >
                  {bulkUploading ? '⏳ Importing...' : `💰 Import ${bulkPreview.filter(i => i.include).length} Sales`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Sales History</h3>
        {sales.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No sales logged yet.</p>
        ) : (
          <div style={{ height: Math.min(sales.length * 80, 420) }}>
            <AnimatedList
              items={sales}
              renderItem={renderSaleItem}
              onItemSelect={handleDelete}
              showGradients={sales.length > 5}
              enableArrowNavigation={true}
              displayScrollbar={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
