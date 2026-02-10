const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// Middleware para verificar rol de entrenador
const isTrainer = (req, res, next) => {
  if (req.user.rol !== 'entrenador' && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo entrenadores.' });
  }
  next();
};

// Middleware para verificar rol de admin
const isAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  }
  next();
};

module.exports = { authenticateToken, isTrainer, isAdmin };
