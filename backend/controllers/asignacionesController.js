const { pool } = require('../config/database');

const DIAS_SEMANA_MAP = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado'
};

// Asignar plantilla a participante (crea snapshot inmutable)
exports.asignarPlantilla = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { participante_id, plantilla_id, mes_anio, notas_entrenador } = req.body;

    if (!participante_id || !plantilla_id || !mes_anio) {
      await connection.rollback();
      return res.status(400).json({ error: 'participante_id, plantilla_id y mes_anio son requeridos' });
    }

    // Verificar que el participante existe
    const [participante] = await connection.query(
      'SELECT id FROM participantes WHERE id = ? AND activo = 1',
      [participante_id]
    );
    if (participante.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Participante no encontrado' });
    }

    // Verificar que la plantilla existe
    const [plantilla] = await connection.query(
      'SELECT id FROM plantillas WHERE id = ? AND activo = 1',
      [plantilla_id]
    );
    if (plantilla.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    // Verificar si ya existe asignación activa para este participante+mes
    const [existente] = await connection.query(
      'SELECT id FROM asignaciones_plan WHERE participante_id = ? AND mes_anio = ? AND activo = 1',
      [participante_id, mes_anio]
    );

    if (existente.length > 0) {
      // Verificar si tiene registros
      const [registros] = await connection.query(
        `SELECT COUNT(*) as total FROM registros_entrenamiento_v2 rev
         JOIN plan_snapshot_ejercicios pse ON rev.snapshot_ejercicio_id = pse.id
         JOIN plan_snapshot_dias psd ON pse.snapshot_dia_id = psd.id
         WHERE psd.asignacion_id = ?`,
        [existente[0].id]
      );

      // Desactivar asignación anterior (snapshot se conserva)
      await connection.query(
        'UPDATE asignaciones_plan SET activo = 0 WHERE id = ?',
        [existente[0].id]
      );

      if (registros[0].total > 0) {
        // Incluir info en respuesta para que el frontend lo sepa
        req._registrosPrevios = registros[0].total;
      }
    }

    // Crear nueva asignación
    const [asignacionResult] = await connection.query(
      `INSERT INTO asignaciones_plan (participante_id, plantilla_id, mes_anio, notas_entrenador, asignado_por)
       VALUES (?, ?, ?, ?, ?)`,
      [participante_id, plantilla_id, mes_anio, notas_entrenador || null, req.user.id]
    );
    const asignacionId = asignacionResult.insertId;

    // Obtener días de la plantilla
    const [dias] = await connection.query(
      'SELECT * FROM plantilla_dias WHERE plantilla_id = ? ORDER BY numero_dia',
      [plantilla_id]
    );

    // Crear snapshot de días y ejercicios
    for (const dia of dias) {
      const diaSemana = DIAS_SEMANA_MAP[dia.numero_dia] || 'Lunes';

      const [snapshotDiaResult] = await connection.query(
        `INSERT INTO plan_snapshot_dias (asignacion_id, numero_dia, nombre_dia, dia_semana)
         VALUES (?, ?, ?, ?)`,
        [asignacionId, dia.numero_dia, dia.nombre_dia, diaSemana]
      );
      const snapshotDiaId = snapshotDiaResult.insertId;

      // Copiar ejercicios con datos del catálogo al momento del snapshot
      await connection.query(
        `INSERT INTO plan_snapshot_ejercicios
           (snapshot_dia_id, ejercicio_catalogo_id, orden, nombre_ejercicio, series, repeticiones, notas,
            imagen_1_url, imagen_2_url, imagen_3_url)
         SELECT ?, pde.ejercicio_id, pde.orden, ce.nombre, pde.series, pde.repeticiones, pde.notas,
                ce.imagen_1_url, ce.imagen_2_url, ce.imagen_3_url
         FROM plantilla_dia_ejercicios pde
         JOIN catalogo_ejercicios ce ON pde.ejercicio_id = ce.id
         WHERE pde.plantilla_dia_id = ?
         ORDER BY pde.orden`,
        [snapshotDiaId, dia.id]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Plantilla asignada exitosamente',
      id: asignacionId,
      registros_previos: req._registrosPrevios || 0
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error asignando plantilla:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

// Obtener asignación + snapshot para un participante y mes específico
exports.obtenerAsignacion = async (req, res) => {
  try {
    const { participante_id, mes_anio } = req.params;

    // Buscar asignación activa
    const [asignaciones] = await pool.query(
      `SELECT a.*, p.nombre AS plantilla_nombre, p.categoria AS plantilla_categoria
       FROM asignaciones_plan a
       JOIN plantillas p ON a.plantilla_id = p.id
       WHERE a.participante_id = ? AND a.mes_anio = ? AND a.activo = 1`,
      [participante_id, mes_anio]
    );

    if (asignaciones.length === 0) {
      return res.json({ asignacion: null, dias: [] });
    }

    const asignacion = asignaciones[0];

    // Obtener snapshot de días
    const [dias] = await pool.query(
      'SELECT * FROM plan_snapshot_dias WHERE asignacion_id = ? ORDER BY numero_dia',
      [asignacion.id]
    );

    // Obtener ejercicios de cada día del snapshot
    for (const dia of dias) {
      const [ejercicios] = await pool.query(
        'SELECT * FROM plan_snapshot_ejercicios WHERE snapshot_dia_id = ? ORDER BY orden',
        [dia.id]
      );
      dia.ejercicios = ejercicios;
    }

    res.json({ asignacion, dias });
  } catch (error) {
    console.error('Error obteniendo asignación:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener plan del mes actual
exports.obtenerPlanActual = async (req, res) => {
  try {
    const { participante_id } = req.params;
    const mesActual = new Date().toISOString().slice(0, 7);

    // Reutilizar lógica
    req.params.mes_anio = mesActual;
    return exports.obtenerAsignacion(req, res);
  } catch (error) {
    console.error('Error obteniendo plan actual:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Historial de asignaciones de un participante
exports.obtenerHistorialAsignaciones = async (req, res) => {
  try {
    const { participante_id } = req.params;

    const [asignaciones] = await pool.query(
      `SELECT a.id, a.plantilla_id, a.mes_anio, a.notas_entrenador, a.fecha_asignacion, a.activo,
              p.nombre AS plantilla_nombre, p.categoria AS plantilla_categoria,
              u.nombre AS asignado_por_nombre
       FROM asignaciones_plan a
       JOIN plantillas p ON a.plantilla_id = p.id
       LEFT JOIN usuarios u ON a.asignado_por = u.id
       WHERE a.participante_id = ?
       ORDER BY a.mes_anio DESC, a.fecha_asignacion DESC`,
      [participante_id]
    );

    res.json(asignaciones);
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Cambiar asignación (reasignar otra plantilla para el mismo mes)
exports.cambiarAsignacion = async (req, res) => {
  // Reutilizar la lógica de asignarPlantilla que ya maneja el caso de asignación existente
  return exports.asignarPlantilla(req, res);
};

// Registrar entrenamiento (nuevo sistema con snapshots)
exports.registrarEntrenamientoV2 = async (req, res) => {
  try {
    const { participante_id, snapshot_ejercicio_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas, comentarios } = req.body;

    if (!participante_id || !snapshot_ejercicio_id || !fecha_registro) {
      return res.status(400).json({ error: 'participante_id, snapshot_ejercicio_id y fecha_registro son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO registros_entrenamiento_v2
       (participante_id, snapshot_ejercicio_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas, comentarios)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [participante_id, snapshot_ejercicio_id, fecha_registro, peso_utilizado || null, series_completadas || null, repeticiones_completadas || null, comentarios || null]
    );

    res.status(201).json({
      message: 'Entrenamiento registrado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error registrando entrenamiento v2:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener registros v2 por participante y rango de fechas
exports.obtenerRegistrosV2 = async (req, res) => {
  try {
    const { participante_id, fecha_inicio, fecha_fin } = req.query;

    let query = `SELECT r.*, pse.nombre_ejercicio, pse.orden,
                        psd.dia_semana, psd.nombre_dia
                 FROM registros_entrenamiento_v2 r
                 JOIN plan_snapshot_ejercicios pse ON r.snapshot_ejercicio_id = pse.id
                 JOIN plan_snapshot_dias psd ON pse.snapshot_dia_id = psd.id
                 WHERE r.participante_id = ?`;
    const params = [participante_id];

    if (fecha_inicio) {
      query += ' AND r.fecha_registro >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND r.fecha_registro <= ?';
      params.push(fecha_fin);
    }

    query += ' ORDER BY r.fecha_registro DESC, psd.numero_dia, pse.orden';

    const [registros] = await pool.query(query, params);
    res.json(registros);
  } catch (error) {
    console.error('Error obteniendo registros v2:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar registro v2
exports.actualizarRegistroV2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { peso_utilizado, series_completadas, repeticiones_completadas, comentarios } = req.body;

    const [result] = await pool.query(
      `UPDATE registros_entrenamiento_v2
       SET peso_utilizado = ?, series_completadas = ?, repeticiones_completadas = ?, comentarios = ?
       WHERE id = ?`,
      [peso_utilizado || null, series_completadas || null, repeticiones_completadas || null, comentarios || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando registro v2:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar registro v2
exports.eliminarRegistroV2 = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM registros_entrenamiento_v2 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando registro v2:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Historial de un ejercicio específico (por snapshot_ejercicio_id)
exports.obtenerHistorialEjercicioV2 = async (req, res) => {
  try {
    const { participante_id, snapshot_ejercicio_id } = req.params;

    // Obtener el nombre del ejercicio del snapshot para buscar en todos los snapshots
    const [ejercicioInfo] = await pool.query(
      'SELECT nombre_ejercicio FROM plan_snapshot_ejercicios WHERE id = ?',
      [snapshot_ejercicio_id]
    );

    if (ejercicioInfo.length === 0) {
      return res.json([]);
    }

    const nombreEjercicio = ejercicioInfo[0].nombre_ejercicio;

    // Buscar registros de TODOS los snapshots que tengan el mismo nombre de ejercicio
    const [registros] = await pool.query(
      `SELECT r.*, pse.nombre_ejercicio
       FROM registros_entrenamiento_v2 r
       JOIN plan_snapshot_ejercicios pse ON r.snapshot_ejercicio_id = pse.id
       WHERE r.participante_id = ? AND pse.nombre_ejercicio = ?
       ORDER BY r.fecha_registro DESC
       LIMIT 20`,
      [participante_id, nombreEjercicio]
    );

    res.json(registros);
  } catch (error) {
    console.error('Error obteniendo historial v2:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener último registro de un ejercicio
exports.obtenerUltimoRegistroV2 = async (req, res) => {
  try {
    const { participante_id, snapshot_ejercicio_id } = req.params;

    const [ejercicioInfo] = await pool.query(
      'SELECT nombre_ejercicio FROM plan_snapshot_ejercicios WHERE id = ?',
      [snapshot_ejercicio_id]
    );

    if (ejercicioInfo.length === 0) {
      return res.json(null);
    }

    const [registros] = await pool.query(
      `SELECT r.*, pse.nombre_ejercicio
       FROM registros_entrenamiento_v2 r
       JOIN plan_snapshot_ejercicios pse ON r.snapshot_ejercicio_id = pse.id
       WHERE r.participante_id = ? AND pse.nombre_ejercicio = ?
       ORDER BY r.fecha_registro DESC
       LIMIT 1`,
      [participante_id, ejercicioInfo[0].nombre_ejercicio]
    );

    res.json(registros.length > 0 ? registros[0] : null);
  } catch (error) {
    console.error('Error obteniendo último registro v2:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};
