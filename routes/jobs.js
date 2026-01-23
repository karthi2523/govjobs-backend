import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Get all jobs (optional category filter)
 */
router.get('/', async (req, res) => {
  try {
    const { category_id, category_slug } = req.query;

    let query = 'SELECT * FROM jobs';
    const params = [];

    if (category_id) {
      query += ' WHERE category_id = $1';
      params.push(category_id);
    } else if (category_slug) {
      const categoryResult = await pool.query(
        'SELECT id FROM categories WHERE slug = $1',
        [category_slug]
      );

      if (categoryResult.rows.length > 0) {
        query += ' WHERE category_id = $1';
        params.push(categoryResult.rows[0].id);
      }
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single job by id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create job (admin only)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      category_id,
      organization,
      post_name,
      vacancies,
      qualification,
      last_date,
      full_details_url,
      notification_url,
      apply_url
    } = req.body;

    if (!category_id || !organization || !post_name) {
      return res.status(400).json({
        error: 'Category, organization, and post name are required'
      });
    }

    // Verify category exists
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const id = randomUUID();

    const insertResult = await pool.query(
      `INSERT INTO jobs (
        id, category_id, organization, post_name, vacancies, qualification,
        last_date, full_details_url, notification_url, apply_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        id,
        category_id,
        organization,
        post_name,
        vacancies || 'Various',
        qualification || 'As per notification',
        last_date || new Date().toISOString().split('T')[0],
        full_details_url || null,
        notification_url || null,
        apply_url || null
      ]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update job (admin only)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      organization,
      post_name,
      vacancies,
      qualification,
      last_date,
      full_details_url,
      notification_url,
      apply_url
    } = req.body;

    const result = await pool.query(
      `UPDATE jobs SET
        category_id = $1,
        organization = $2,
        post_name = $3,
        vacancies = $4,
        qualification = $5,
        last_date = $6,
        full_details_url = $7,
        notification_url = $8,
        apply_url = $9
      WHERE id = $10
      RETURNING *`,
      [
        category_id,
        organization,
        post_name,
        vacancies,
        qualification,
        last_date,
        full_details_url,
        notification_url,
        apply_url,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete job (admin only)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
