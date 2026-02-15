const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Obtener plan de entrenamiento por participante y mes
exports.obtenerPlanEntrenamiento = async (req, res) => {
  try {
    const { participante_id, mes_anio } = req.params;

    // Obtener el plan via procedimiento
    const [planResult] = await pool.query('CALL sp_get_plan_entrenamiento(?, ?)', [participante_id, mes_anio]);
    const planes = planResult && planResult[0] ? planResult[0] : [];

    if (planes.length === 0) {
      return res.json({ plan: null, ejercicios: [] });
    }

    const plan = planes[0];

    // Obtener ejercicios del plan via procedimiento
    const [ejResult] = await pool.query('CALL sp_get_ejercicios_plan(?)', [plan.id]);
    const ejercicios = ejResult && ejResult[0] ? ejResult[0] : [];

    res.json({ plan, ejercicios });
  } catch (error) {
    console.error('Error obteniendo plan de entrenamiento:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear o actualizar plan de entrenamiento completo
exports.guardarPlanEntrenamiento = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { participante_id, mes_año, ejercicios } = req.body;

    if (!participante_id || !mes_año || !ejercicios) {
      await connection.rollback();
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Upsert plan via procedimiento (retorna plan_id y is_new)
    const [upsertResult] = await connection.query('CALL sp_upsert_plan_entrenamiento(?, ?, ?)', [participante_id, mes_año, req.user.id]);
    const up = upsertResult && upsertResult[0] && upsertResult[0][0] ? upsertResult[0][0] : null;
    let planId = up ? up.plan_id : null;

    if (!planId) {
      throw new Error('No se pudo determinar plan_id después del upsert');
    }

    // Eliminar ejercicios antiguos via procedimiento
    await connection.query('CALL sp_delete_ejercicios_plan(?)', [planId]);

    // Insertar nuevos ejercicios
    if (ejercicios && ejercicios.length > 0) {
      const ejerciciosValues = ejercicios.map(ej => [
        planId,
        ej.dia_semana,
        ej.orden,
        ej.nombre_ejercicio,
        ej.series,
        ej.repeticiones,
        ej.notas,
        ej.imagenes_url ? JSON.stringify(ej.imagenes_url) : null
      ]);

      await connection.query(
        `INSERT INTO ejercicios_plan
         (plan_id, dia_semana, orden, nombre_ejercicio, series, repeticiones, notas, imagenes_url)
         VALUES ?`,
        [ejerciciosValues]
      );
    }

    await connection.commit();

    res.json({
      message: 'Plan de entrenamiento guardado exitosamente',
      plan_id: planId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error guardando plan de entrenamiento:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

// Obtener todos los planes de un participante
exports.obtenerPlanesParticipante = async (req, res) => {
  try {
    const { participante_id } = req.params;

    const [spResult] = await pool.query('CALL sp_get_planes_participante_list(?)', [participante_id]);
    const planes = spResult && spResult[0] ? spResult[0] : [];
    res.json(planes);
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar plan de entrenamiento
exports.eliminarPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [spResult] = await pool.query('CALL sp_delete_plan_entrenamiento(?)', [id]);
    const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json({ message: 'Plan eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando plan:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Registrar entrenamiento (log)
exports.registrarEntrenamiento = async (req, res) => {
  try {
    const { participante_id, ejercicio_plan_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas, comentarios } = req.body;
    const [spResult] = await pool.query('CALL sp_insert_registro_plan(?, ?, ?, ?, ?, ?, ?)', [
      participante_id, ejercicio_plan_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas, comentarios
    ]);

    const insertId = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].insertId : null;

    res.status(201).json({
      message: 'Entrenamiento registrado exitosamente',
      id: insertId
    });
  } catch (error) {
    console.error('Error registrando entrenamiento:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener registros de entrenamiento
exports.obtenerRegistros = async (req, res) => {
  try {
    const { participante_id, fecha_inicio, fecha_fin } = req.query;
    const params = [participante_id, fecha_inicio || null, fecha_fin || null];
    const [spResult] = await pool.query('CALL sp_get_registros_plan(?, ?, ?)', params);
    const registros = spResult && spResult[0] ? spResult[0] : [];
    res.json(registros);
  } catch (error) {
    console.error('Error obteniendo registros:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener historial de un ejercicio específico
exports.obtenerHistorialEjercicio = async (req, res) => {
  try {
    const { participante_id, ejercicio_plan_id } = req.params;
    const [spResult] = await pool.query('CALL sp_get_historial_ejercicio_plan(?, ?)', [participante_id, ejercicio_plan_id]);
    const registros = spResult && spResult[0] ? spResult[0] : [];
    res.json(registros);
  } catch (error) {
    console.error('Error obteniendo historial del ejercicio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener último registro de un ejercicio
exports.obtenerUltimoRegistro = async (req, res) => {
  try {
    const { participante_id, ejercicio_plan_id } = req.params;
    const [spResult] = await pool.query('CALL sp_get_ultimo_registro_plan(?, ?)', [participante_id, ejercicio_plan_id]);
    const registros = spResult && spResult[0] ? spResult[0] : [];
    res.json(registros.length > 0 ? registros[0] : null);
  } catch (error) {
    console.error('Error obteniendo último registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar registro de entrenamiento
exports.actualizarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { peso_utilizado, series_completadas, repeticiones_completadas, comentarios } = req.body;
    const [spResult] = await pool.query('CALL sp_update_registro_plan(?, ?, ?, ?, ?)', [
      id, peso_utilizado, series_completadas, repeticiones_completadas, comentarios
    ]);

    const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar registro de entrenamiento
exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const [spResult] = await pool.query('CALL sp_delete_registro_plan(?)', [id]);
    const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ message: 'Registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Subir imagen de ejercicio
exports.subirImagenEjercicio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    const imagen_url = `/api/uploads/ejercicios/${req.file.filename}`;

    res.json({
      message: 'Imagen subida exitosamente',
      imagen_url: imagen_url,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
};

// Eliminar imagen de ejercicio
exports.eliminarImagenEjercicio = async (req, res) => {
  try {
    const { imagen_url } = req.body;

    if (!imagen_url) {
      return res.status(400).json({ error: 'No se proporcionó URL de imagen' });
    }

    const filename = path.basename(imagen_url);
    const filePath = path.join(__dirname, '..', 'uploads', 'ejercicios', filename);

    // Validar que la ruta resuelta está dentro del directorio de uploads
    const uploadsDir = path.resolve(path.join(__dirname, '..', 'uploads', 'ejercicios'));
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Ruta de archivo inválida' });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
};
