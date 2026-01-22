import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to ensure admit_cards table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admit_cards (
        id VARCHAR(36) PRIMARY KEY,
        exam_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        exam_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring admit_cards table exists:', err);
  }
}

// Get all admit cards
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [admitCards] = await pool.execute(
      'SELECT * FROM admit_cards ORDER BY exam_date DESC, created_at DESC'
    );
    res.json(admitCards);
  } catch (error) {
    console.error('Error fetching admit cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single admit card by id
router.get('/:id', async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [admitCards] = await pool.execute('SELECT * FROM admit_cards WHERE id = ?', [id]);
    
    if (admitCards.length === 0) {
      return res.status(404).json({ error: 'Admit card not found' });
    }
    
    res.json(admitCards[0]);
  } catch (error) {
    console.error('Error fetching admit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create admit card (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { exam_name, organization, exam_date, status, download_url } = req.body;
    
    if (!exam_name || !organization || !exam_date) {
      return res.status(400).json({ 
        error: 'Exam name, organization, and exam date are required' 
      });
    }
    
    const validStatuses = ['PENDING', 'AVAILABLE'];
    const cardStatus = (status && validStatuses.includes(status.toUpperCase())) 
      ? status.toUpperCase() 
      : 'PENDING';
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      `INSERT INTO admit_cards (id, exam_name, organization, exam_date, status, download_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, exam_name, organization, exam_date, cardStatus, download_url || null]
    );
    
    const [newCard] = await pool.execute('SELECT * FROM admit_cards WHERE id = ?', [id]);
    res.status(201).json(newCard[0]);
  } catch (error) {
    console.error('Error creating admit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admit card (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { exam_name, organization, exam_date, status, download_url } = req.body;
    
    let cardStatus = status;
    if (status) {
      const validStatuses = ['PENDING', 'AVAILABLE'];
      if (validStatuses.includes(status.toUpperCase())) {
        cardStatus = status.toUpperCase();
      } else {
        return res.status(400).json({ error: 'Invalid status. Must be PENDING or AVAILABLE' });
      }
    }
    
    const updates = [];
    const values = [];
    
    if (exam_name !== undefined) { updates.push('exam_name = ?'); values.push(exam_name); }
    if (organization !== undefined) { updates.push('organization = ?'); values.push(organization); }
    if (exam_date !== undefined) { updates.push('exam_date = ?'); values.push(exam_date); }
    if (cardStatus !== undefined) { updates.push('status = ?'); values.push(cardStatus); }
    if (download_url !== undefined) { updates.push('download_url = ?'); values.push(download_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE admit_cards SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Admit card not found' });
    }
    
    const [updatedCard] = await pool.execute('SELECT * FROM admit_cards WHERE id = ?', [id]);
    res.json(updatedCard[0]);
  } catch (error) {
    console.error('Error updating admit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete admit card (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM admit_cards WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Admit card not found' });
    }
    
    res.json({ success: true, message: 'Admit card deleted successfully' });
  } catch (error) {
    console.error('Error deleting admit card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
