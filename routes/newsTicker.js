import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Helper function to ensure news_ticker table exists
async function ensureNewsTickerTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS news_ticker (
        id VARCHAR(36) PRIMARY KEY,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring news_ticker table exists:', err);
  }
}

// Get all news ticker items (public - only active items)
router.get('/', async (req, res) => {
  try {
    await ensureNewsTickerTable();
    
    const [items] = await pool.execute(
      'SELECT * FROM news_ticker WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching news ticker items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all news ticker items (admin - includes inactive)
router.get('/admin', authenticateAdmin, async (req, res) => {
  try {
    await ensureNewsTickerTable();
    
    const [items] = await pool.execute(
      'SELECT * FROM news_ticker ORDER BY display_order ASC, created_at DESC'
    );
    res.json(items);
  } catch (error) {
    console.error('Error fetching news ticker items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single news ticker item by id
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureNewsTickerTable();
    
    const { id } = req.params;
    const [items] = await pool.execute(
      'SELECT * FROM news_ticker WHERE id = ?',
      [id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'News ticker item not found' });
    }
    
    res.json(items[0]);
  } catch (error) {
    console.error('Error fetching news ticker item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new news ticker item
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureNewsTickerTable();
    
    const { content, is_active, display_order } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const id = randomUUID();
    const active = is_active !== undefined ? is_active : true;
    const order = display_order !== undefined ? display_order : 0;
    
    await pool.execute(
      'INSERT INTO news_ticker (id, content, is_active, display_order) VALUES (?, ?, ?, ?)',
      [id, content.trim(), active, order]
    );
    
    const [newItem] = await pool.execute(
      'SELECT * FROM news_ticker WHERE id = ?',
      [id]
    );
    
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating news ticker item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update news ticker item
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureNewsTickerTable();
    
    const { id } = req.params;
    const { content, is_active, display_order } = req.body;
    
    // Check if item exists
    const [existing] = await pool.execute(
      'SELECT * FROM news_ticker WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'News ticker item not found' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }
      updates.push('content = ?');
      values.push(content.trim());
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE news_ticker SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const [updated] = await pool.execute(
      'SELECT * FROM news_ticker WHERE id = ?',
      [id]
    );
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating news ticker item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete news ticker item
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureNewsTickerTable();
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM news_ticker WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'News ticker item not found' });
    }
    
    res.json({ message: 'News ticker item deleted successfully' });
  } catch (error) {
    console.error('Error deleting news ticker item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

