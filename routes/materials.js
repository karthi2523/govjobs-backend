import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Get all materials (public)
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM materials ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single material by id (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM materials WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create material (admin only)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { organization, subject, download_url } = req.body;

    if (!organization || !subject) {
      return res.status(400).json({
        error: 'Organization and subject are required'
      });
    }

    const id = randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO materials (
        id, organization, subject, download_url
      ) VALUES ($1,$2,$3,$4)
      RETURNING *`,
      [id, organization, subject, download_url || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update material (admin only)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization, subject, download_url } = req.body;

    const fields = [];
    const values = [];
    let index = 1;

    if (organization !== undefined) {
      fields.push(`organization = $${index++}`);
      values.push(organization);
    }

    if (subject !== undefined) {
      fields.push(`subject = $${index++}`);
      values.push(subject);
    }

    if (download_url !== undefined) {
      fields.push(`download_url = $${index++}`);
      values.push(download_url);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const { rows, rowCount } = await pool.query(
      `UPDATE materials
       SET ${fields.join(', ')}
       WHERE id = $${index}
       RETURNING *`,
      values
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete material (admin only)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM materials WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
