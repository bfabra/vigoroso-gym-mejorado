const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { BCRYPT_ROUNDS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Login de Usuario (Entrenador/Admin)
exports.loginUsuario = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const [usuarios] = await pool.query(
    'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
    [email]
  );

  if (usuarios.length === 0) {
    logger.warn(`Intento de login fallido para usuario: ${email}`);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const usuario = usuarios[0];
  const validPassword = await bcrypt.compare(password, usuario.password);

  if (!validPassword) {
    logger.warn(`Contraseña incorrecta para usuario: ${email}`);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, tipo: 'usuario' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  logger.info(`Login exitoso - Usuario: ${usuario.email} (ID: ${usuario.id})`);

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    }
  });
});

// Login de Participante
exports.loginParticipante = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const [participantes] = await pool.query(
    'SELECT * FROM participantes WHERE email = ? AND activo = TRUE',
    [email]
  );

  if (participantes.length === 0) {
    logger.warn(`Intento de login fallido para participante: ${email}`);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const participante = participantes[0];
  const validPassword = await bcrypt.compare(password, participante.password);

  if (!validPassword) {
    logger.warn(`Contraseña incorrecta para participante: ${email}`);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { id: participante.id, email: participante.email, rol: 'participante', tipo: 'participante' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  logger.info(`Login exitoso - Participante: ${participante.email} (ID: ${participante.id})`);

  res.json({
    token,
    participante: {
      id: participante.id,
      nombre: participante.nombre,
      email: participante.email
    }
  });
});

// Registro de nuevo usuario (solo admin)
exports.registrarUsuario = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hashedPassword, rol || 'entrenador']
  );

  logger.info(`Nuevo usuario registrado: ${email} (ID: ${result.insertId})`);

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    id: result.insertId
  });
});

// Verificar token
exports.verificarToken = asyncHandler(async (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});
