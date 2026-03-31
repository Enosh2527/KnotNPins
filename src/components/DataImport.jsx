import { useState } from 'react';
import * as XLSX from 'xlsx';
import { addPurchase, addSale, addExpense } from '../services/db';

export default function DataImport() {
  const [fileData, setFileData] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [targetType, setTargetType] = useState('purchases');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      // Get first worksheet
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      // Convert to json arrays
      const data = XLSX.utils.sheet_to_json(ws);
      setFileData(data);
      setImportStatus(`Ready to import ${data.length} rows to ${targetType}.`);
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (!fileData || fileData.length === 0) return;
    
    setImportStatus('Importing...');
    try {
      let successCount = 0;
      
      for (const row of fileData) {
        if (targetType === 'legacy_master') {
          // Master Auto-Parse for Knot & Pins Custom Excel
          const pName = row['Product Name'] || row['Item Name'];
          if (pName) {
            // 1. Add Purchase
            await addPurchase({
              date: row.Date || new Date().toISOString().split('T')[0],
              itemName: String(pName),
              quantity: Number(row.Quantity || 0),
              unitCost: Number(row['per piece cost'] || row['Unit Cost'] || 0),
              totalCost: Number(row['purchased price'] || row['Total Cost'] || 0)
            });
            successCount++;

            // 2. Add Sales from Stalls if applicable
            const salePriceUnit = Number(row['Sale Price'] || 0);

            const stalls = [
              { qty: Number(row['SALE QUANTITY STALL 1'] || 0), name: 'Stall 1' },
              { qty: Number(row['SALE QUANTITY STALL 2'] || 0), name: 'Stall 2' },
              { qty: Number(row['SALE QUANTITY STALL 3'] || 0), name: 'Stall 3' }
            ];

            for (const stall of stalls) {
              if (stall.qty > 0) {
                await addSale({
                  date: row.Date || new Date().toISOString().split('T')[0],
                  itemSold: String(pName),
                  quantity: stall.qty,
                  sellingPrice: stall.qty * salePriceUnit,
                  paymentMethod: `${stall.name} (Legacy)`
                });
                successCount++;
              }
            }
          }
        } else if (targetType === 'purchases') {
          await addPurchase({
            date: row.Date || row.date || new Date().toISOString().split('T')[0],
            itemName: row['Product Name'] || row['Item Name'] || row.itemName || row.item || 'Unknown Item',
            quantity: Number(row.Quantity || row.qty || 1),
            unitCost: Number(row['per piece cost'] || row['Unit Cost'] || row.unitCost || 0),
            totalCost: Number(row['purchased price'] || row['Total Cost'] || row.totalCost || 0)
          });
        } else if (targetType === 'sales') {
          await addSale({
            date: row.Date || row.date || new Date().toISOString().split('T')[0],
            itemSold: row['Item Sold'] || row.itemSold || row.item || 'Unknown Item',
            quantity: Number(row.Quantity || row.qty || 1),
            sellingPrice: Number(row['Selling Price'] || row.price || 0),
            paymentMethod: row['Payment Method'] || row.method || 'Cash'
          });
        } else if (targetType === 'expenses') {
          await addExpense({
            date: row.Date || row.date || new Date().toISOString().split('T')[0],
            category: row.Category || row.category || 'Other',
            amount: Number(row.Amount || row.amount || 0),
            description: row.Description || row.desc || 'Imported Expense'
          });
        }
        successCount++;
      }
      setImportStatus(`Successfully imported ${successCount} ${targetType}.`);
      setFileData(null); // clear after success
    } catch (err) {
      console.error(err);
      setImportStatus('Error during import. Check console.');
    }
  };

  return (
    <div className="animate-fade-in import-container">
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Bulk Import Data from Excel</h3>
        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Upload your .xlsx or .csv files to migrate your old records. The column names should ideally match the fields required (e.g. "Item Name", "Quantity", "Date").
        </p>

        <div className="form-group" style={{ marginBottom: '1.5rem', maxWidth: '300px' }}>
          <label className="form-label">Destination Table</label>
          <select 
            className="form-control" 
            value={targetType} 
            onChange={(e) => {
              setTargetType(e.target.value);
              setFileData(null);
              setImportStatus('');
            }}
          >
            <option value="legacy_master">Auto-Parse Master Sheet (Purchases + All Stalls)</option>
            <option value="purchases">Purchases (Stock)</option>
            <option value="sales">Sales (Revenue)</option>
            <option value="expenses">Expenses (Costs)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Upload File</label>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload} 
            className="form-control" 
            style={{ maxWidth: '400px' }}
          />
        </div>

        {importStatus && (
          <p style={{ margin: '1rem 0', fontWeight: 600, color: importStatus.includes('Error') ? 'var(--danger-color)' : 'var(--primary-color)' }}>
            {importStatus}
          </p>
        )}

        {fileData && (
          <button onClick={processImport} className="btn btn-primary" style={{ backgroundColor: '#2e7d32' }}>
            Confirm Import
          </button>
        )}

        {/* Data Preview */}
        {fileData && fileData.length > 0 && (
          <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
            <h4>Preview (First 3 rows)</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  {Object.keys(fileData[0]).map(key => (
                    <th key={key} style={{ padding: '0.5rem' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fileData.slice(0, 3).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ padding: '0.5rem' }}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
