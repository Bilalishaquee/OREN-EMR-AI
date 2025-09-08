// import jwt from 'jsonwebtoken';

// // Authentication middleware
// export const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
  
//   if (!token) return res.status(401).json({ message: 'Access denied' });
//   console.log('[AUTH]', req.method, req.originalUrl);
  
//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: 'Invalid token' });
//     req.user = user;
//     next();
//   });
// };
// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const path = req.originalUrl || req.url;

  // Allow Google OAuth callback without JWT
  if (
    path === '/api/google-calendar/callback' ||
    path.startsWith('/api/google-calendar/callback?')
  ) {
    return next();
  }

  // (optional) allow CORS preflight
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};
