const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { BCRYPT_ROUNDS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: errors.array()
    });
  }
  next();
};

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
  const [usuarios] = await pool.query(
    'SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC'
  );

  res.json({
    data: usuarios,
    total: usuarios.length
  });
}));

// Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, isAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({ message: 'Usuario eliminado exitosamente' });
}));

// Admin resetea contraseña de usuario (entrenador/admin)
router.patch('/:id/cambiar-password', authenticateToken, isAdmin,
  body('nueva_password')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nueva_password } = req.body;

    const hashedPassword = await bcrypt.hash(nueva_password, BCRYPT_ROUNDS);

    const [result] = await pool.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    logger.info(`Admin cambió contraseña de usuario ID ${id}`);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  })
);

// Admin cambia email de usuario (entrenador/admin)
router.patch('/:id/cambiar-email', authenticateToken, isAdmin,
  body('nuevo_email')
    .notEmpty().withMessage('El nuevo email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nuevo_email } = req.body;

    // Verificar que el email no esté en uso
    const [emailExistente] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [nuevo_email, id]
    );

    if (emailExistente.length > 0) {
      return res.status(400).json({ error: 'Este email ya está en uso' });
    }

    // Obtener email anterior
    const [usuarios] = await pool.query(
      'SELECT email FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const emailAnterior = usuarios[0].email;

    // Actualizar email
    const [result] = await pool.query(
      'UPDATE usuarios SET email = ? WHERE id = ?',
      [nuevo_email, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    logger.info(`Admin cambió email de usuario ID ${id} de ${emailAnterior} a ${nuevo_email}`);

    res.json({ message: 'Email actualizado exitosamente', nuevo_email });
  })
);

module.exports = router;
