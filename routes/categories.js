import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(categories[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      'INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)',
      [id, name.trim(), slug]
    );
    
    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    
    res.status(201).json(newCategory[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Category already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

