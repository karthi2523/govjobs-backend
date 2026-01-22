import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to ensure previous_papers table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS previous_papers (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        year INT NOT NULL,
        paper_type VARCHAR(255) NOT NULL,
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring previous_papers table exists:', err);
  }
}

// Get all previous papers
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [papers] = await pool.execute(
      'SELECT * FROM previous_papers ORDER BY year DESC, created_at DESC'
    );
    res.json(papers);
  } catch (error) {
    console.error('Error fetching previous papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single previous paper by id
router.get('/:id', async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [papers] = await pool.execute('SELECT * FROM previous_papers WHERE id = ?', [id]);
    
    if (papers.length === 0) {
      return res.status(404).json({ error: 'Previous paper not found' });
    }
    
    res.json(papers[0]);
  } catch (error) {
    console.error('Error fetching previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create previous paper (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { exam_name, organization, year, paper_type, download_url } = req.body;
    
    if (!exam_name || !organization || !year || !paper_type) {
      return res.status(400).json({ 
        error: 'Exam name, organization, year, and paper type are required' 
      });
    }
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      `INSERT INTO previous_papers (id, exam_name, organization, year, paper_type, download_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, exam_name, organization, year, paper_type, download_url || null]
    );
    
    const [newPaper] = await pool.execute('SELECT * FROM previous_papers WHERE id = ?', [id]);
    res.status(201).json(newPaper[0]);
  } catch (error) {
    console.error('Error creating previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update previous paper (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { exam_name, organization, year, paper_type, download_url } = req.body;
    
    const updates = [];
    const values = [];
    
    if (exam_name !== undefined) { updates.push('exam_name = ?'); values.push(exam_name); }
    if (organization !== undefined) { updates.push('organization = ?'); values.push(organization); }
    if (year !== undefined) { updates.push('year = ?'); values.push(year); }
    if (paper_type !== undefined) { updates.push('paper_type = ?'); values.push(paper_type); }
    if (download_url !== undefined) { updates.push('download_url = ?'); values.push(download_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE previous_papers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Previous paper not found' });
    }
    
    const [updatedPaper] = await pool.execute('SELECT * FROM previous_papers WHERE id = ?', [id]);
    res.json(updatedPaper[0]);
  } catch (error) {
    console.error('Error updating previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete previous paper (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM previous_papers WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Previous paper not found' });
    }
    
    res.json({ success: true, message: 'Previous paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting previous paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
