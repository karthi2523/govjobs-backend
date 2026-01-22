import jwt from 'jsonwebtoken';

// Use JWT_SECRET from env or default for development
const JWT_SECRET = process.env.JWT_SECRET || 'govjobs-default-secret-key-2024-dev-only';

export const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

