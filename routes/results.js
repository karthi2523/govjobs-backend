import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to ensure results table exists
async function ensureResultsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS results (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        result_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring results table exists:', err);
  }
}

// Get all results
router.get('/', async (req, res) => {
  try {
    // Ensure table exists before querying
    await ensureResultsTable();
    
    const [results] = await pool.execute(
      'SELECT * FROM results ORDER BY result_date DESC, created_at DESC'
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single result by id
router.get('/:id', async (req, res) => {
  try {
    await ensureResultsTable();
    
    const { id } = req.params;
    const [results] = await pool.execute(
      'SELECT * FROM results WHERE id = ?',
      [id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create result (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureResultsTable();
    
    const {
      exam_name,
      organization,
      result_date,
      status,
      download_url
    } = req.body;
    
    // Validate required fields
    if (!exam_name || !organization || !result_date) {
      return res.status(400).json({ 
        error: 'Exam name, organization, and result date are required' 
      });
    }
    
    // Validate status
    const validStatuses = ['PENDING', 'RELEASED'];
    const resultStatus = (status && validStatuses.includes(status.toUpperCase())) 
      ? status.toUpperCase() 
      : 'PENDING';
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      `INSERT INTO results (
        id, exam_name, organization, result_date, status, download_url
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        exam_name,
        organization,
        result_date,
        resultStatus,
        download_url || null
      ]
    );
    
    const [newResult] = await pool.execute(
      'SELECT * FROM results WHERE id = ?',
      [id]
    );
    
    res.status(201).json(newResult[0]);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update result (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureResultsTable();
    
    const { id } = req.params;
    const {
      exam_name,
      organization,
      result_date,
      status,
      download_url
    } = req.body;
    
    // Validate status if provided
    let resultStatus = status;
    if (status) {
      const validStatuses = ['PENDING', 'RELEASED'];
      if (validStatuses.includes(status.toUpperCase())) {
        resultStatus = status.toUpperCase();
      } else {
        return res.status(400).json({ error: 'Invalid status. Must be PENDING or RELEASED' });
      }
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (exam_name !== undefined) {
      updates.push('exam_name = ?');
      values.push(exam_name);
    }
    if (organization !== undefined) {
      updates.push('organization = ?');
      values.push(organization);
    }
    if (result_date !== undefined) {
      updates.push('result_date = ?');
      values.push(result_date);
    }
    if (resultStatus !== undefined) {
      updates.push('status = ?');
      values.push(resultStatus);
    }
    if (download_url !== undefined) {
      updates.push('download_url = ?');
      values.push(download_url);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE results SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    const [updatedResult] = await pool.execute(
      'SELECT * FROM results WHERE id = ?',
      [id]
    );
    
    res.json(updatedResult[0]);
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete result (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureResultsTable();
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM results WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


