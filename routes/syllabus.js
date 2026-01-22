import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to ensure syllabus table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS syllabus (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring syllabus table exists:', err);
  }
}

// Get all syllabus
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [syllabus] = await pool.execute(
      'SELECT * FROM syllabus ORDER BY created_at DESC'
    );
    res.json(syllabus);
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single syllabus by id
router.get('/:id', async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [syllabus] = await pool.execute('SELECT * FROM syllabus WHERE id = ?', [id]);
    
    if (syllabus.length === 0) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }
    
    res.json(syllabus[0]);
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create syllabus (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { exam_name, organization, download_url } = req.body;
    
    if (!exam_name || !organization) {
      return res.status(400).json({ 
        error: 'Exam name and organization are required' 
      });
    }
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      `INSERT INTO syllabus (id, exam_name, organization, download_url)
       VALUES (?, ?, ?, ?)`,
      [id, exam_name, organization, download_url || null]
    );
    
    const [newSyllabus] = await pool.execute('SELECT * FROM syllabus WHERE id = ?', [id]);
    res.status(201).json(newSyllabus[0]);
  } catch (error) {
    console.error('Error creating syllabus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update syllabus (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { exam_name, organization, download_url } = req.body;
    
    const updates = [];
    const values = [];
    
    if (exam_name !== undefined) { updates.push('exam_name = ?'); values.push(exam_name); }
    if (organization !== undefined) { updates.push('organization = ?'); values.push(organization); }
    if (download_url !== undefined) { updates.push('download_url = ?'); values.push(download_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE syllabus SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }
    
    const [updatedSyllabus] = await pool.execute('SELECT * FROM syllabus WHERE id = ?', [id]);
    res.json(updatedSyllabus[0]);
  } catch (error) {
    console.error('Error updating syllabus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete syllabus (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM syllabus WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Syllabus not found' });
    }
    
    res.json({ success: true, message: 'Syllabus deleted successfully' });
  } catch (error) {
    console.error('Error deleting syllabus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
