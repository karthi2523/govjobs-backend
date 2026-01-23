import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Get all previous papers (public)
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM previous_papers
       ORDER BY year DESC, created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching previous papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single previous paper by id (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM previous_papers WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Previous paper not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create previous paper (admin only)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { exam_name, organization, year, paper_type, download_url } = req.body;

    if (!exam_name || !organization || !year || !paper_type) {
      return res.status(400).json({
        error: 'Exam name, organization, year, and paper type are required'
      });
    }

    const id = randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO previous_papers (
        id, exam_name, organization, year, paper_type, download_url
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        id,
        exam_name,
        organization,
        year,
        paper_type,
        download_url || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update previous paper (admin only)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { exam_name, organization, year, paper_type, download_url } = req.body;

    const fields = [];
    const values = [];
    let index = 1;

    if (exam_name !== undefined) {
      fields.push(`exam_name = $${index++}`);
      values.push(exam_name);
    }

    if (organization !== undefined) {
      fields.push(`organization = $${index++}`);
      values.push(organization);
    }

    if (year !== undefined) {
      fields.push(`year = $${index++}`);
      values.push(year);
    }

    if (paper_type !== undefined) {
      fields.push(`paper_type = $${index++}`);
      values.push(paper_type);
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
      `UPDATE previous_papers
       SET ${fields.join(', ')}
       WHERE id = $${index}
       RETURNING *`,
      values
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Previous paper not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete previous paper (admin only)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM previous_papers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Previous paper not found' });
    }

    res.json({ success: true, message: 'Previous paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
