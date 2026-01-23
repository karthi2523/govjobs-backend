import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Get all results (public)
 */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM results
       ORDER BY result_date DESC, created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single result by id (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'SELECT * FROM results WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create result (admin only)
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      exam_name,
      organization,
      result_date,
      status,
      download_url
    } = req.body;

    if (!exam_name || !organization || !result_date) {
      return res.status(400).json({
        error: 'Exam name, organization, and result date are required'
      });
    }

    const validStatuses = ['PENDING', 'RELEASED'];
    const finalStatus =
      status && validStatuses.includes(status.toUpperCase())
        ? status.toUpperCase()
        : 'PENDING';

    const id = randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO results (
        id, exam_name, organization, result_date, status, download_url
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        id,
        exam_name,
        organization,
        result_date,
        finalStatus,
        download_url || null
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update result (admin only)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      exam_name,
      organization,
      result_date,
      status,
      download_url
    } = req.body;

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

    if (result_date !== undefined) {
      fields.push(`result_date = $${index++}`);
      values.push(result_date);
    }

    if (status !== undefined) {
      const validStatuses = ['PENDING', 'RELEASED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          error: 'Invalid status. Must be PENDING or RELEASED'
        });
      }
      fields.push(`status = $${index++}`);
      values.push(status.toUpperCase());
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
      `UPDATE results
       SET ${fields.join(', ')}
       WHERE id = $${index}
       RETURNING *`,
      values
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete result (admin only)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM results WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
