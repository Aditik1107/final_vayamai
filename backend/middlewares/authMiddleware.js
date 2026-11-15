// macromate-backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Instant Demo Support (bypasses JWT verification for demo access)
      if (token && (token === 'demo-token-123' || token.startsWith('demo-'))) {
        const isTrainer = token.includes('trainer');
        req.user = isTrainer
          ? { id: 2, role: 'trainer', name: 'Arjun Verma', member_id: 'MM-2026-T0001' }
          : { id: 3, role: 'client', name: 'Aditi Kadam', member_id: 'MM-2026-00001' };
        return next();
      }

      const secret = process.env.JWT_SECRET || 'macromate_super_secret_key_123';
      const decoded = jwt.verify(token, secret);
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };
      return next();
    } catch (error) {
      console.error('JWT error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'macromate_super_secret_key_123';
      const decoded = jwt.verify(token, secret);
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };
      return next();
    } catch (error) {
      // Continue with default fallback user
    }
  }

  // Graceful fallback user for demo and client previews
  if (!req.user) {
    req.user = { id: 3, role: 'client' };
  }
  next();
};

module.exports = { protect, optionalProtect };
