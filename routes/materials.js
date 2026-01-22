import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to ensure materials table exists
async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(36) PRIMARY KEY,
        organization VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        download_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring materials table exists:', err);
  }
}

// Get all materials
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [materials] = await pool.execute(
      'SELECT * FROM materials ORDER BY created_at DESC'
    );
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single material by id
router.get('/:id', async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [materials] = await pool.execute('SELECT * FROM materials WHERE id = ?', [id]);
    
    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(materials[0]);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create material (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { organization, subject, download_url } = req.body;
    
    if (!organization || !subject) {
      return res.status(400).json({ 
        error: 'Organization and subject are required' 
      });
    }
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      `INSERT INTO materials (id, organization, subject, download_url)
       VALUES (?, ?, ?, ?)`,
      [id, organization, subject, download_url || null]
    );
    
    const [newMaterial] = await pool.execute('SELECT * FROM materials WHERE id = ?', [id]);
    res.status(201).json(newMaterial[0]);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update material (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { organization, subject, download_url } = req.body;
    
    const updates = [];
    const values = [];
    
    if (organization !== undefined) { updates.push('organization = ?'); values.push(organization); }
    if (subject !== undefined) { updates.push('subject = ?'); values.push(subject); }
    if (download_url !== undefined) { updates.push('download_url = ?'); values.push(download_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const [result] = await pool.execute(
      `UPDATE materials SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    const [updatedMaterial] = await pool.execute('SELECT * FROM materials WHERE id = ?', [id]);
    res.json(updatedMaterial[0]);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete material (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM materials WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
