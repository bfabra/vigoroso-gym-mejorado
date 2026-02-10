const { pool } = require('../config/database');

// Obtener plan de nutrición de un participante
exports.obtenerPlanNutricion = async (req, res) => {
  try {
    const { participante_id } = req.params;

    // Obtener el plan activo via procedimiento
    const [planResult] = await pool.query('CALL sp_get_plan_nutricion(?)', [participante_id]);
    const planes = planResult && planResult[0] ? planResult[0] : [];

    if (planes.length === 0) {
      return res.json({ plan: null, comidas: [] });
    }

    const plan = planes[0];

    // Obtener comidas del plan via procedimiento
    const [comidasResult] = await pool.query('CALL sp_get_comidas_plan(?)', [plan.id]);
    const comidas = comidasResult && comidasResult[0] ? comidasResult[0] : [];

    res.json({ plan, comidas });
  } catch (error) {
    console.error('Error obteniendo plan de nutrición:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear o actualizar plan de nutrición
exports.guardarPlanNutricion = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { participante_id, comidas, recomendaciones_generales } = req.body;

    if (!participante_id || !comidas) {
      await connection.rollback();
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Crear nuevo plan via procedimiento (desactiva previos e inserta)
    const [spResult] = await connection.query('CALL sp_create_plan_nutricion(?, ?, ?)', [
      participante_id,
      req.user.id,
      recomendaciones_generales
    ]);

    const planId = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].insertId : null;

    // Insertar comidas
    if (comidas && comidas.length > 0 && planId) {
      const comidasValues = comidas.map(comida => [
        planId,
        comida.tipo_comida,
        comida.opcion_1,
        comida.opcion_2
      ]);

      await connection.query(
        `INSERT INTO comidas_plan 
         (plan_nutricion_id, tipo_comida, opcion_1, opcion_2) 
         VALUES ?`,
        [comidasValues]
      );
    }

    await connection.commit();

    res.json({
      message: 'Plan de nutrición guardado exitosamente',
      plan_id: planId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error guardando plan de nutrición:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

// Obtener todos los planes de nutrición de un participante
exports.obtenerHistorialPlanes = async (req, res) => {
  try {
    const { participante_id } = req.params;

    const [planesResult] = await pool.query('CALL sp_obtener_historial_planes(?)', [participante_id]);
    const planes = planesResult && planesResult[0] ? planesResult[0] : [];
    res.json(planes);
  } catch (error) {
    console.error('Error obteniendo historial de planes:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Eliminar plan de nutrición
exports.eliminarPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [spResult] = await pool.query('CALL sp_eliminar_plan(?)', [id]);
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

// Actualizar plan de nutrición existente
exports.actualizarPlanNutricion = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { comidas, recomendaciones_generales } = req.body;

    // Actualizar recomendaciones via procedimiento
    const [spResult] = await connection.query('CALL sp_actualizar_plan_recomendaciones(?, ?)', [
      id,
      recomendaciones_generales
    ]);

    const affectedRows = spResult && spResult[0] && spResult[0][0] ? spResult[0][0].affectedRows : 0;

    if (affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Eliminar comidas antiguas
    await connection.query('DELETE FROM comidas_plan WHERE plan_nutricion_id = ?', [id]);

    // Insertar nuevas comidas
    if (comidas && comidas.length > 0) {
      const comidasValues = comidas.map(comida => [
        id,
        comida.tipo_comida,
        comida.opcion_1,
        comida.opcion_2
      ]);

      await connection.query(
        `INSERT INTO comidas_plan 
         (plan_nutricion_id, tipo_comida, opcion_1, opcion_2) 
         VALUES ?`,
        [comidasValues]
      );
    }

    await connection.commit();

    res.json({ message: 'Plan de nutrición actualizado exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando plan de nutrición:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};
