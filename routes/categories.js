import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Get all categories (public)
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single category by slug (public)
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create category (admin only)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const id = randomUUID();

    const insertResult = await pool.query(
      'INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3) RETURNING *',
      [id, name.trim(), slug]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    // PostgreSQL duplicate key error
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Category already exists' });
    }

    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete category (admin only)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
