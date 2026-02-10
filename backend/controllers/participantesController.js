const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { BCRYPT_ROUNDS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Obtener todos los participantes (con paginación)
exports.obtenerParticipantes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;

  // Obtener total de participantes via procedimiento
  const [countResult] = await pool.query('CALL sp_get_participantes_count()');
  const total = countResult && countResult[0] && countResult[0][0] ? countResult[0][0].total : 0;

  // Obtener participantes paginados via procedimiento
  const [partsResult] = await pool.query('CALL sp_get_participantes(?, ?)', [limit, offset]);
  const participantes = partsResult && partsResult[0] ? partsResult[0] : [];

  res.json({
    data: participantes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  });
});

// Obtener un participante por ID
exports.obtenerParticipante = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [spResult] = await pool.query('CALL sp_get_participante(?)', [id]);
  const rows = spResult && spResult[0] ? spResult[0] : [];

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  res.json(rows[0]);
});

// Crear nuevo participante
exports.crearParticipante = asyncHandler(async (req, res) => {
  const { nombre, email, password, telefono, fecha_nacimiento, genero } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  }

  // Revisar si existe participante con este email
  const [existing] = await pool.query('SELECT * FROM participantes WHERE email = ? LIMIT 1', [email]);

  if (existing && existing.length > 0) {
    const ex = existing[0];
    if (ex.activo) {
      return res.status(400).json({ error: 'Ya existe un participante con ese email' });
    }

    // Reactivar participante inactivo: hashear password y llamar procedimiento
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [reactRes] = await pool.query('CALL sp_reactivar_participante(?, ?, ?, ?, ?, ?, ?)', [
      email,
      nombre,
      hashedPassword,
      telefono,
      fecha_nacimiento,
      genero,
      req.user.id
    ]);

    const re = reactRes && reactRes[0] && reactRes[0][0] ? reactRes[0][0] : null;
    if (re && re.affectedRows > 0) {
      logger.info(`Participante reactivado: ${email} (ID: ${re.id}) por usuario ${req.user.id}`);
      return res.status(200).json({ message: 'Participante reactivado exitosamente', id: re.id });
    }

    // Fallback: si no se reactivó, devolver error
    return res.status(500).json({ error: 'No se pudo reactivar el participante' });
  }

  // No existe: crear nuevo participante
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [spResult] = await pool.query(
    `INSERT INTO participantes 
     (nombre, email, password, telefono, fecha_nacimiento, genero, usuario_creador_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [nombre, email, hashedPassword, telefono, fecha_nacimiento, genero, req.user.id]
  );

  logger.info(`Nuevo participante creado: ${email} (ID: ${spResult.insertId}) por usuario ${req.user.id}`);

  res.status(201).json({ message: 'Participante creado exitosamente', id: spResult.insertId });
});

// Actualizar participante
exports.actualizarParticipante = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, fecha_nacimiento, genero } = req.body;
  const [spResult] = await pool.query('CALL sp_actualizar_participante(?, ?, ?, ?, ?, ?)', [
    id,
    nombre,
    email,
    telefono,
    fecha_nacimiento,
    genero
  ]);

  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  logger.info(`Participante actualizado: ID ${id} por usuario ${req.user.id}`);

  res.json({ message: 'Participante actualizado exitosamente' });
});

// Eliminar participante (soft delete)
exports.eliminarParticipante = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [spResult] = await pool.query('CALL sp_eliminar_participante(?)', [id]);
  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  logger.info(`Participante eliminado (soft delete): ID ${id} por usuario ${req.user.id}`);

  res.json({ message: 'Participante eliminado exitosamente' });
});

// Cambiar contraseña del participante
exports.cambiarPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nueva_password } = req.body;

  if (!nueva_password) {
    return res.status(400).json({ error: 'Nueva contraseña es requerida' });
  }

  const hashedPassword = await bcrypt.hash(nueva_password, BCRYPT_ROUNDS);

  const [spResult] = await pool.query('CALL sp_cambiar_password(?, ?)', [id, hashedPassword]);
  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  logger.info(`Contraseña cambiada para participante ID ${id}`);

  res.json({ message: 'Contraseña actualizada exitosamente' });
});

// Cambiar contraseña propia del participante (verificando la actual)
exports.cambiarPasswordPropia = asyncHandler(async (req, res) => {
  const participanteId = req.user.id; // Del token JWT
  const { password_actual, password_nueva } = req.body;

  // Verificar que es un participante
  if (req.user.rol !== 'participante') {
    return res.status(403).json({ error: 'Solo participantes pueden usar esta función' });
  }

  // Obtener participante actual
  const [participantes] = await pool.query(
    'SELECT id, password FROM participantes WHERE id = ?',
    [participanteId]
  );

  if (participantes.length === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  const participante = participantes[0];

  // Verificar contraseña actual
  const passwordValida = await bcrypt.compare(password_actual, participante.password);
  if (!passwordValida) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  }

  // Hashear nueva contraseña
  const hashedPassword = await bcrypt.hash(password_nueva, BCRYPT_ROUNDS);

  // Actualizar contraseña
  await pool.query(
    'UPDATE participantes SET password = ? WHERE id = ?',
    [hashedPassword, participanteId]
  );

  logger.info(`Participante ID ${participanteId} cambió su propia contraseña`);

  res.json({ message: 'Contraseña actualizada exitosamente' });
});

// Cambiar email propio del participante (verificando contraseña)
exports.cambiarEmailPropio = asyncHandler(async (req, res) => {
  const participanteId = req.user.id;
  const { password, nuevo_email } = req.body;

  // Verificar que es un participante
  if (req.user.rol !== 'participante') {
    return res.status(403).json({ error: 'Solo participantes pueden usar esta función' });
  }

  // Obtener participante actual
  const [participantes] = await pool.query(
    'SELECT id, password, email FROM participantes WHERE id = ?',
    [participanteId]
  );

  if (participantes.length === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  const participante = participantes[0];

  // Verificar contraseña
  const passwordValida = await bcrypt.compare(password, participante.password);
  if (!passwordValida) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  // Verificar que el email no esté en uso
  const [emailExistente] = await pool.query(
    'SELECT id FROM participantes WHERE email = ? AND id != ?',
    [nuevo_email, participanteId]
  );

  if (emailExistente.length > 0) {
    return res.status(400).json({ error: 'Este email ya está en uso' });
  }

  // Actualizar email
  await pool.query(
    'UPDATE participantes SET email = ? WHERE id = ?',
    [nuevo_email, participanteId]
  );

  logger.info(`Participante ID ${participanteId} cambió su email de ${participante.email} a ${nuevo_email}`);

  res.json({ message: 'Email actualizado exitosamente', nuevo_email });
});

// Admin cambia email de participante
exports.cambiarEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nuevo_email } = req.body;

  // Verificar que el email no esté en uso
  const [emailExistente] = await pool.query(
    'SELECT id FROM participantes WHERE email = ? AND id != ?',
    [nuevo_email, id]
  );

  if (emailExistente.length > 0) {
    return res.status(400).json({ error: 'Este email ya está en uso' });
  }

  // Obtener email anterior
  const [participantes] = await pool.query(
    'SELECT email FROM participantes WHERE id = ?',
    [id]
  );

  if (participantes.length === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  const emailAnterior = participantes[0].email;

  // Actualizar email
  const [result] = await pool.query(
    'UPDATE participantes SET email = ? WHERE id = ?',
    [nuevo_email, id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Participante no encontrado' });
  }

  logger.info(`Admin cambió email de participante ID ${id} de ${emailAnterior} a ${nuevo_email}`);

  res.json({ message: 'Email actualizado exitosamente', nuevo_email });
});
