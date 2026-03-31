import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite DB
const db = new Database(path.join(__dirname, 'database.sqlite'));

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    date TEXT,
    itemName TEXT,
    quantity INTEGER,
    unitCost REAL,
    totalCost REAL,
    sellingPricePerUnit REAL DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date TEXT,
    itemSold TEXT,
    quantity INTEGER,
    sellingPrice REAL,
    paymentMethod TEXT,
    source TEXT DEFAULT 'Offline',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT,
    category TEXT,
    amount REAL,
    description TEXT,
    createdAt TEXT
  );
`);

// Simple automated migration for existing DB files
try {
  db.exec("ALTER TABLE sales ADD COLUMN source TEXT DEFAULT 'Offline'");
} catch (e) {
  // Column already exists, ignore
}

// --- Purchases API ---
app.get('/api/purchases', (req, res) => {
  const stmt = db.prepare('SELECT * FROM purchases ORDER BY createdAt DESC');
  res.json(stmt.all());
});

app.post('/api/purchases', (req, res) => {
  const purchase = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO purchases (id, date, itemName, quantity, unitCost, totalCost, sellingPricePerUnit, createdAt)
    VALUES (@id, @date, @itemName, @quantity, @unitCost, @totalCost, @sellingPricePerUnit, @createdAt)
  `);
  
  stmt.run({ id, createdAt, sellingPricePerUnit: purchase.sellingPricePerUnit || 0, ...purchase });
  res.status(201).json({ id, createdAt, ...purchase });
});

app.delete('/api/purchases/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM purchases WHERE id = ?');
  stmt.run(req.params.id);
  res.sendStatus(204);
});

// --- Sales API ---
app.get('/api/sales', (req, res) => {
  const stmt = db.prepare('SELECT * FROM sales ORDER BY createdAt DESC');
  res.json(stmt.all());
});

app.post('/api/sales', (req, res) => {
  const sale = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  // Ensure source falls back properly if omitted
  const sourceVal = sale.source && sale.source.trim() !== '' ? sale.source : 'Offline';
  
  const stmt = db.prepare(`
    INSERT INTO sales (id, date, itemSold, quantity, sellingPrice, paymentMethod, source, createdAt)
    VALUES (@id, @date, @itemSold, @quantity, @sellingPrice, @paymentMethod, @source, @createdAt)
  `);
  
  stmt.run({ id, createdAt, source: sourceVal, ...sale });
  res.status(201).json({ id, createdAt, source: sourceVal, ...sale });
});

app.delete('/api/sales/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM sales WHERE id = ?');
  stmt.run(req.params.id);
  res.sendStatus(204);
});

// --- Expenses API ---
app.get('/api/expenses', (req, res) => {
  const stmt = db.prepare('SELECT * FROM expenses ORDER BY createdAt DESC');
  res.json(stmt.all());
});

app.post('/api/expenses', (req, res) => {
  const expense = req.body;
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const createdAt = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO expenses (id, date, category, amount, description, createdAt)
    VALUES (@id, @date, @category, @amount, @description, @createdAt)
  `);
  
  stmt.run({ id, createdAt, ...expense });
  res.status(201).json({ id, createdAt, ...expense });
});

app.delete('/api/expenses/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
  stmt.run(req.params.id);
  res.sendStatus(204);
});

// Start Server
app.listen(port, () => {
  console.log(`Knot & Pins backend listening at http://localhost:${port}`);
});
