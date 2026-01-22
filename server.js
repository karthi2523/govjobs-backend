import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import jobsRoutes from './routes/jobs.js';
import resultsRoutes from './routes/results.js';
import admitCardsRoutes from './routes/admitCards.js';
import syllabusRoutes from './routes/syllabus.js';
import previousPapersRoutes from './routes/previousPapers.js';
import materialsRoutes from './routes/materials.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from project root (one level up from backend)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Use default JWT_SECRET if not set (for development)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set in environment variables!');
  console.warn('   Using default secret for development. Set JWT_SECRET in .env for production.');
  process.env.JWT_SECRET = 'govjobs-default-secret-key-2024-dev-only';
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admit-cards', admitCardsRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/previous-papers', previousPapersRoutes);
app.use('/api/materials', materialsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

