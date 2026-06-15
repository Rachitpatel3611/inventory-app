# 📦 Inventory Management App

A full-stack web application to manage inventory purchases and stock items, built with Node.js, Express, and MySQL.

## 🚀 Features

- Add a purchase with multiple items in one form submission
- Each item has a Name, Type, and Stock availability status
- View all purchases and items in a clean table
- Edit and Delete individual items inline
- Backend validation on all required fields
- MySQL JOIN query to fetch items with their type names
- Clean and responsive UI with CSS styling

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Libraries | mysql2, cors, body-parser |

## 📁 Project Structure

```
inventory-app/
├── config/
│   ├── db.js          # MySQL connection pool
│   └── init.sql       # Database schema
├── routes/
│   └── items.js       # API routes
├── public/
│   ├── index.html     # Frontend HTML
│   ├── style.css      # CSS styling
│   └── app.js         # Frontend JavaScript
├── server.js          # Express server
└── package.json
```

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Rachitpatel3611/inventory-app.git
cd inventory-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup MySQL Database
Open MySQL and run:
```sql
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

CREATE TABLE IF NOT EXISTS item_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  item_type_id INT NOT NULL,
  purchase_id INT NOT NULL,
  stock_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_type_id) REFERENCES item_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

INSERT IGNORE INTO item_types (type_name) VALUES
  ('Electronics'), ('Furniture'), ('Clothing'),
  ('Stationery'), ('Food & Beverages'), ('Sports & Outdoors'),
  ('Books'), ('Tools & Hardware'), ('Health & Beauty'), ('Toys & Games');
```

### 4. Configure Database Connection
Open `config/db.js` and update your MySQL credentials:
```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password_here',
  database: 'inventory_db',
});
```

### 5. Start the Server
```bash
node server.js
```

### 6. Open in Browser
```
http://localhost:3000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/item-types | Get all item type categories |
| GET | /api/purchases | Get all purchases with items (JOIN) |
| POST | /api/purchases | Create new purchase with items |
| PUT | /api/items/:id | Update an item |
| DELETE | /api/items/:id | Delete an item |

## 👤 Author

**Rachit Patel**
- GitHub: [@Rachitpatel3611](https://github.com/Rachitpatel3611)