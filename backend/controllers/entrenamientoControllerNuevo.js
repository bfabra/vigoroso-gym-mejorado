const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// ========================================
// PLANES DE ENTRENAMIENTO
// ========================================

// Obtener todos los planes de un participante
exports.obtenerPlanesParticipante = asyncHandler(async (req, res) => {
  const { participante_id } = req.params;

  const [spResult] = await pool.query('CALL sp_get_planes_participante(?)', [participante_id]);
  const planes = spResult && spResult[0] ? spResult[0] : [];
  res.json(planes);
});

// Obtener un plan completo con todos sus días y ejercicios
exports.obtenerPlanCompleto = asyncHandler(async (req, res) => {
  const { plan_id } = req.params;

  const [planResult] = await pool.query('CALL sp_get_plan_header(?)', [plan_id]);
  const planes = planResult && planResult[0] ? planResult[0] : [];

  if (planes.length === 0) {
    return res.status(404).json({ error: 'Plan no encontrado' });
  }

  const plan = planes[0];

  const [diasResult] = await pool.query('CALL sp_get_dias_plan(?)', [plan_id]);
  const dias = diasResult && diasResult[0] ? diasResult[0] : [];

  for (let dia of dias) {
    const [ejRes] = await pool.query('CALL sp_get_ejercicios_dia(?)', [dia.id]);
    dia.ejercicios = ejRes && ejRes[0] ? ejRes[0] : [];
  }

  plan.dias = dias;

  res.json(plan);
});

// Crear un plan de entrenamiento completo
exports.crearPlanCompleto = asyncHandler(async (req, res) => {
  const { 
    participante_id, 
    nombre, 
    descripcion, 
    objetivo, 
    nivel, 
    duracion_semanas,
    fecha_inicio,
    dias 
  } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Crear el plan principal via procedimiento
    const [spPlan] = await connection.query('CALL sp_create_plan(?, ?, ?, ?, ?, ?, ?, ?)', [
      participante_id, nombre, descripcion, objetivo, nivel, duracion_semanas, fecha_inicio, req.user.id
    ]);

    const plan_id = spPlan && spPlan[0] && spPlan[0][0] ? spPlan[0][0].insertId : null;

    // 2. Crear cada día con sus ejercicios
    if (dias && dias.length > 0) {
      for (let dia of dias) {
        // Insertar día via procedimiento
        const [spDia] = await connection.query('CALL sp_create_dia(?, ?, ?, ?, ?, ?)', [
          plan_id,
          dia.numero_dia,
          dia.nombre,
          dia.descripcion || null,
          dia.notas || null,
          dia.orden || dia.numero_dia
        ]);

        const dia_id = spDia && spDia[0] && spDia[0][0] ? spDia[0][0].insertId : null;

        // Insertar ejercicios del día
        if (dia.ejercicios && dia.ejercicios.length > 0) {
          for (let i = 0; i < dia.ejercicios.length; i++) {
            const ejercicio = dia.ejercicios[i];
            // Insertar ejercicio via procedimiento
            await connection.query('CALL sp_create_ejercicio(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
              dia_id,
              ejercicio.nombre_ejercicio,
              ejercicio.series,
              ejercicio.repeticiones,
              ejercicio.peso || null,
              ejercicio.descanso || null,
              ejercicio.notas || null,
              ejercicio.video_url || null,
              ejercicio.orden || (i + 1)
            ]);
          }
        }
      }
    }

    await connection.commit();

    logger.info(`Plan de entrenamiento creado: ${nombre} (ID: ${plan_id}) para participante ${participante_id}`);

    res.status(201).json({
      message: 'Plan de entrenamiento creado exitosamente',
      plan_id
    });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// Actualizar un plan de entrenamiento
exports.actualizarPlan = asyncHandler(async (req, res) => {
  const { plan_id } = req.params;
  const { nombre, descripcion, objetivo, nivel, duracion_semanas, fecha_inicio, fecha_fin } = req.body;

  const [spResult] = await pool.query('CALL sp_update_plan(?, ?, ?, ?, ?, ?, ?, ?)', [
    plan_id, nombre, descripcion, objetivo, nivel, duracion_semanas, fecha_inicio, fecha_fin
  ]);

  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Plan no encontrado' });
  }

  logger.info(`Plan actualizado: ID ${plan_id}`);

  res.json({ message: 'Plan actualizado exitosamente' });
});

// Eliminar un plan (soft delete)
exports.eliminarPlan = asyncHandler(async (req, res) => {
  const { plan_id } = req.params;

  const [spResult] = await pool.query('CALL sp_soft_delete_plan(?)', [plan_id]);
  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Plan no encontrado' });
  }

  logger.info(`Plan eliminado: ID ${plan_id}`);

  res.json({ message: 'Plan eliminado exitosamente' });
});

// ========================================
// DÍAS DE ENTRENAMIENTO
// ========================================

// Agregar un día a un plan existente
exports.agregarDia = asyncHandler(async (req, res) => {
  const { plan_id } = req.params;
  const { numero_dia, nombre, descripcion, notas, ejercicios } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Insertar día via procedimiento
    const [spDia] = await connection.query('CALL sp_create_dia(?, ?, ?, ?, ?, ?)', [
      plan_id, numero_dia, nombre, descripcion || null, notas || null, numero_dia
    ]);

    const dia_id = spDia && spDia[0] && spDia[0][0] ? spDia[0][0].insertId : null;

    // Insertar ejercicios si se proporcionaron
    if (ejercicios && ejercicios.length > 0) {
        for (let i = 0; i < ejercicios.length; i++) {
          const ejercicio = ejercicios[i];
          await connection.query('CALL sp_create_ejercicio(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            dia_id,
            ejercicio.nombre_ejercicio,
            ejercicio.series,
            ejercicio.repeticiones,
            ejercicio.peso || null,
            ejercicio.descanso || null,
            ejercicio.notas || null,
            ejercicio.video_url || null,
            ejercicio.orden || (i + 1)
          ]);
        }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Día agregado exitosamente',
      dia_id
    });

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// Actualizar un día
exports.actualizarDia = asyncHandler(async (req, res) => {
  const { dia_id } = req.params;
  const { nombre, descripcion, notas } = req.body;

  const [spResult] = await pool.query('CALL sp_update_dia(?, ?, ?, ?)', [dia_id, nombre, descripcion, notas]);
  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Día no encontrado' });
  }

  res.json({ message: 'Día actualizado exitosamente' });
});

// Eliminar un día
exports.eliminarDia = asyncHandler(async (req, res) => {
  const { dia_id } = req.params;

  const [spResult] = await pool.query('CALL sp_soft_delete_dia(?)', [dia_id]);
  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Día no encontrado' });
  }

  res.json({ message: 'Día eliminado exitosamente' });
});

// ========================================
// EJERCICIOS
// ========================================

// Agregar ejercicio a un día
exports.agregarEjercicio = asyncHandler(async (req, res) => {
  const { dia_id } = req.params;
  const { nombre_ejercicio, series, repeticiones, peso, descanso, notas, video_url, orden } = req.body;

  const [spResult] = await pool.query('CALL sp_create_ejercicio(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    dia_id, nombre_ejercicio, series, repeticiones, peso, descanso, notas, video_url, orden
  ]);

  const ejercicio_id = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].insertId : null;

  res.status(201).json({
    message: 'Ejercicio agregado exitosamente',
    ejercicio_id
  });
});

// Actualizar ejercicio
exports.actualizarEjercicio = asyncHandler(async (req, res) => {
  const { ejercicio_id } = req.params;
  const { nombre_ejercicio, series, repeticiones, peso, descanso, notas, video_url, orden } = req.body;

  const [spResult] = await pool.query('CALL sp_update_ejercicio(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    ejercicio_id, nombre_ejercicio, series, repeticiones, peso, descanso, notas, video_url, orden
  ]);

  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Ejercicio no encontrado' });
  }

  res.json({ message: 'Ejercicio actualizado exitosamente' });
});

// Eliminar ejercicio
exports.eliminarEjercicio = asyncHandler(async (req, res) => {
  const { ejercicio_id } = req.params;

  const [spResult] = await pool.query('CALL sp_soft_delete_ejercicio(?)', [ejercicio_id]);
  const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

  if (affectedRows === 0) {
    return res.status(404).json({ error: 'Ejercicio no encontrado' });
  }

  res.json({ message: 'Ejercicio eliminado exitosamente' });
});

// ========================================
// REGISTROS DE ENTRENAMIENTO
// ========================================

// Registrar la ejecución de un ejercicio
exports.registrarEjercicio = asyncHandler(async (req, res) => {
  const { 
    participante_id, 
    ejercicio_dia_id, 
    fecha, 
    series_completadas, 
    repeticiones_reales, 
    peso_utilizado, 
    dificultad, 
    notas 
  } = req.body;

  const [spResult] = await pool.query('CALL sp_create_registro(?, ?, ?, ?, ?, ?, ?, ?)', [
    participante_id, ejercicio_dia_id, fecha, series_completadas, repeticiones_reales, peso_utilizado, dificultad, notas
  ]);

  const registro_id = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].insertId : null;

  logger.info(`Registro de ejercicio creado para participante ${participante_id}`);

  res.status(201).json({
    message: 'Ejercicio registrado exitosamente',
    registro_id
  });
});

// Obtener historial de un ejercicio
exports.obtenerHistorialEjercicio = asyncHandler(async (req, res) => {
  const { participante_id, ejercicio_dia_id } = req.params;
  const [spResult] = await pool.query('CALL sp_get_historial_ejercicio(?, ?)', [participante_id, ejercicio_dia_id]);
  const registros = spResult && spResult[0] ? spResult[0] : [];
  res.json(registros);
});

// Obtener progreso de un participante en un plan
exports.obtenerProgresoParticipante = asyncHandler(async (req, res) => {
  const { participante_id, plan_id } = req.params;
  const { fecha_inicio, fecha_fin } = req.query;

  const params = [participante_id, plan_id, fecha_inicio || null, fecha_fin || null];
  const [spResult] = await pool.query('CALL sp_get_progreso_participante(?, ?, ?, ?)', params);
  const progreso = spResult && spResult[0] ? spResult[0] : [];
  res.json(progreso);
});

module.exports = exports;
