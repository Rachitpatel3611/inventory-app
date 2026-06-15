const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Validation helper
function validatePurchase({ purchase_date, items }) {
  const errors = [];

  if (!purchase_date) {
    errors.push('Purchase date is required.');
  } else {
    const d = new Date(purchase_date);
    if (isNaN(d.getTime())) errors.push('Purchase date is invalid.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one item is required.');
  } else {
    items.forEach((item, i) => {
      const idx = i + 1;
      if (!item.name || item.name.trim() === '') {
        errors.push(`Item ${idx}: Name is required.`);
      }
      if (!item.item_type_id) {
        errors.push(`Item ${idx}: Item type is required.`);
      }
    });
  }

  return errors;
}

// GET all item types (for dropdown)
router.get('/item-types', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, type_name FROM item_types ORDER BY type_name'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch item types.' });
  }
});

// GET all purchases with items using JOIN
router.get('/purchases', async (req, res) => {
  try {
    const [purchases] = await pool.query(
      `SELECT p.id AS purchase_id, p.purchase_date, p.created_at
       FROM purchases p
       ORDER BY p.purchase_date DESC, p.created_at DESC`
    );

    const [items] = await pool.query(
      `SELECT i.id, i.name, i.stock_available, i.purchase_id,
              it.id AS item_type_id, it.type_name
       FROM items i
       JOIN item_types it ON i.item_type_id = it.id
       ORDER BY i.id ASC`
    );

    const result = purchases.map(p => ({
      ...p,
      items: items.filter(item => item.purchase_id === p.purchase_id)
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch purchases.' });
  }
});

// POST create a new purchase with items
router.post('/purchases', async (req, res) => {
  const { purchase_date, items } = req.body;

  const errors = validatePurchase({ purchase_date, items });
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [purchaseResult] = await conn.query(
      'INSERT INTO purchases (purchase_date) VALUES (?)',
      [purchase_date]
    );
    const purchaseId = purchaseResult.insertId;

    const itemValues = items.map(item => [
      item.name.trim(),
      Number(item.item_type_id),
      purchaseId,
      item.stock_available ? 1 : 0
    ]);

    await conn.query(
      'INSERT INTO items (name, item_type_id, purchase_id, stock_available) VALUES ?',
      [itemValues]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: `Purchase saved with ${items.length} item(s).`
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save purchase.' });
  } finally {
    conn.release();
  }
});

// PUT update an item
router.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, item_type_id, stock_available } = req.body;
  const errors = [];

  if (!name || name.trim() === '') errors.push('Item name is required.');
  if (!item_type_id) errors.push('Item type is required.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM items WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    await pool.query(
      'UPDATE items SET name = ?, item_type_id = ?, stock_available = ? WHERE id = ?',
      [name.trim(), Number(item_type_id), stock_available ? 1 : 0, id]
    );

    res.json({ success: true, message: 'Item updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update item.' });
  }
});

// DELETE an item
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [item] = await conn.query(
      'SELECT purchase_id FROM items WHERE id = ?', [id]
    );
    if (item.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const purchaseId = item[0].purchase_id;
    await conn.query('DELETE FROM items WHERE id = ?', [id]);

    const [remaining] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM items WHERE purchase_id = ?', [purchaseId]
    );
    if (remaining[0].cnt === 0) {
      await conn.query('DELETE FROM purchases WHERE id = ?', [purchaseId]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Item deleted successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete item.' });
  } finally {
    conn.release();
  }
});

// DELETE entire purchase
router.delete('/purchases/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM purchases WHERE id = ?', [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Purchase not found.' });
    }
    await pool.query('DELETE FROM purchases WHERE id = ?', [id]);
    res.json({ success: true, message: 'Purchase deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to delete purchase.' });
  }
});

module.exports = router;