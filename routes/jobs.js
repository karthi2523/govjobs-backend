import express from 'express';
import pool from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const { category_id, category_slug } = req.query;
    let query = 'SELECT * FROM jobs';
    let params = [];
    
    if (category_id) {
      query += ' WHERE category_id = ?';
      params.push(category_id);
    } else if (category_slug) {
      // First get category id from slug
      const [categories] = await pool.execute(
        'SELECT id FROM categories WHERE slug = ?',
        [category_slug]
      );
      
      if (categories.length > 0) {
        query += ' WHERE category_id = ?';
        params.push(categories[0].id);
      }
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [jobs] = await pool.execute(query, params);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single job by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await pool.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [id]
    );
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(jobs[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create job (admin only)
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
    
    // Validate required fields
    if (!category_id || !organization || !post_name) {
      return res.status(400).json({ 
        error: 'Category, organization, and post name are required' 
      });
    }
    
    // Verify category exists
    const [categories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [category_id]
    );
    
    if (categories.length === 0) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    
    await pool.execute(
      `INSERT INTO jobs (
        id, category_id, organization, post_name, vacancies, qualification,
        last_date, full_details_url, notification_url, apply_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    
    const [newJob] = await pool.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [id]
    );
    
    res.status(201).json(newJob[0]);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job (admin only)
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
    
    const [result] = await pool.execute(
      `UPDATE jobs SET
        category_id = ?, organization = ?, post_name = ?, vacancies = ?,
        qualification = ?, last_date = ?, full_details_url = ?,
        notification_url = ?, apply_url = ?
      WHERE id = ?`,
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
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const [updatedJob] = await pool.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [id]
    );
    
    res.json(updatedJob[0]);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete job (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM jobs WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

