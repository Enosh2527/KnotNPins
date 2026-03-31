DROP TABLE IF EXISTS purchases;
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  date TEXT,
  itemName TEXT,
  quantity INTEGER,
  unitCost REAL,
  totalCost REAL,
  sellingPricePerUnit REAL DEFAULT 0,
  createdAt TEXT
);

DROP TABLE IF EXISTS sales;
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  date TEXT,
  itemSold TEXT,
  quantity INTEGER,
  sellingPrice REAL,
  paymentMethod TEXT,
  source TEXT DEFAULT 'Offline',
  createdAt TEXT
);

DROP TABLE IF EXISTS expenses;
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  date TEXT,
  category TEXT,
  amount REAL,
  description TEXT,
  createdAt TEXT
);
