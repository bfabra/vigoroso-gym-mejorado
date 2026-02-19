const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { BCRYPT_ROUNDS } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// POST /api/auth/solicitar-cuenta — ruta pública
exports.solicitarCuenta = asyncHandler(async (req, res) => {
  const { nombre, email, password, telefono, fecha_nacimiento, genero } = req.body;

  // Verificar que no exista participante activo con este email
  const [participanteExistente] = await pool.query(
    'SELECT id FROM participantes WHERE email = ? AND activo = TRUE LIMIT 1',
    [email]
  );
  if (participanteExistente.length > 0) {
    return res.status(400).json({ error: 'Ya existe una cuenta activa con este email' });
  }

  // Verificar que no haya solicitud pendiente con este email
  const [solicitudExistente] = await pool.query(
    "SELECT id FROM solicitudes_registro WHERE email = ? AND estado = 'pendiente' LIMIT 1",
    [email]
  );
  if (solicitudExistente.length > 0) {
    return res.status(400).json({ error: 'Ya existe una solicitud pendiente con este email' });
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await pool.query(
    `INSERT INTO solicitudes_registro (nombre, email, password_hash, telefono, fecha_nacimiento, genero)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      email,
      password_hash,
      telefono || null,
      fecha_nacimiento || null,
      genero || null
    ]
  );

  logger.info(`Nueva solicitud de registro: ${email}`);
  res.status(201).json({ message: 'Solicitud enviada correctamente. El administrador revisará tu solicitud en breve.' });
});

// GET /api/solicitudes?estado=pendiente|aprobado|rechazado — admin
exports.listarSolicitudes = asyncHandler(async (req, res) => {
  const { estado } = req.query;

  let sql = `SELECT id, nombre, email, telefono, fecha_nacimiento, genero,
               estado, motivo_rechazo, fecha_solicitud, fecha_resolucion
             FROM solicitudes_registro`;
  const params = [];

  if (estado && ['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
    sql += ' WHERE estado = ?';
    params.push(estado);
  }

  sql += ' ORDER BY fecha_solicitud DESC';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// POST /api/solicitudes/:id/aprobar — admin
exports.aprobarSolicitud = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    "SELECT * FROM solicitudes_registro WHERE id = ? AND estado = 'pendiente' LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
  }

  const solicitud = rows[0];

  // Re-verificar que no se haya creado el participante manualmente mientras tanto
  const [existente] = await pool.query(
    'SELECT id FROM participantes WHERE email = ? LIMIT 1',
    [solicitud.email]
  );
  if (existente.length > 0) {
    return res.status(409).json({ error: 'Ya existe un participante con este email. Rechaza la solicitud.' });
  }

  // Crear participante usando el hash ya generado
  await pool.query(
    `INSERT INTO participantes (nombre, email, password, telefono, fecha_nacimiento, genero, usuario_creador_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      solicitud.nombre,
      solicitud.email,
      solicitud.password_hash,
      solicitud.telefono || null,
      solicitud.fecha_nacimiento || null,
      solicitud.genero || null,
      req.user.id
    ]
  );

  // Actualizar estado
  await pool.query(
    "UPDATE solicitudes_registro SET estado = 'aprobado', fecha_resolucion = NOW(), resuelto_por = ? WHERE id = ?",
    [req.user.id, id]
  );

  logger.info(`Solicitud aprobada: ${solicitud.email} (id=${id}) por usuario ${req.user.id}`);
  res.json({ message: 'Solicitud aprobada. Participante creado exitosamente.' });
});

// POST /api/solicitudes/:id/rechazar — admin
exports.rechazarSolicitud = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  const [rows] = await pool.query(
    "SELECT id FROM solicitudes_registro WHERE id = ? AND estado = 'pendiente' LIMIT 1",
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
  }

  await pool.query(
    "UPDATE solicitudes_registro SET estado = 'rechazado', motivo_rechazo = ?, fecha_resolucion = NOW(), resuelto_por = ? WHERE id = ?",
    [motivo || null, req.user.id, id]
  );

  logger.info(`Solicitud rechazada: id=${id} por usuario ${req.user.id}`);
  res.json({ message: 'Solicitud rechazada.' });
});
