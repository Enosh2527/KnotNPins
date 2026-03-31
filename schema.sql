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

CREATE TABLE IF NOT EXISTS app_settings (
  key_name TEXT PRIMARY KEY,
  value_json TEXT
);
INSERT OR IGNORE INTO app_settings (key_name, value_json) VALUES ('salesSources', '["Offline", "Online", "Stall 1", "Stall 2", "Stall 3"]');
INSERT OR IGNORE INTO app_settings (key_name, value_json) VALUES ('paymentMethods', '["UPI", "Cash", "Card", "Other"]');
INSERT OR IGNORE INTO app_settings (key_name, value_json) VALUES ('expenseCategories', '["Raw Materials", "Packaging", "Shipping", "Marketing", "Rent/Stall Fee", "Other"]');
