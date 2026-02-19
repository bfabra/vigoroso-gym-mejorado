const { pool } = require('../config/database');

// Listar plantillas con filtros
exports.listarPlantillas = async (req, res) => {
  try {
    const { categoria, activo } = req.query;
    let query = 'SELECT * FROM plantillas WHERE 1=1';
    const params = [];

    if (activo !== undefined) {
      query += ' AND activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    } else {
      query += ' AND activo = 1';
    }

    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    query += ' ORDER BY categoria, nombre';

    const [plantillas] = await pool.query(query, params);
    res.json(plantillas);
  } catch (error) {
    console.error('Error listando plantillas:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener plantilla completa con días y ejercicios (nested)
exports.obtenerPlantilla = async (req, res) => {
  try {
    const { id } = req.params;

    const [plantillas] = await pool.query('SELECT * FROM plantillas WHERE id = ?', [id]);
    if (plantillas.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const plantilla = plantillas[0];

    // Obtener días
    const [dias] = await pool.query(
      'SELECT * FROM plantilla_dias WHERE plantilla_id = ? ORDER BY numero_dia',
      [id]
    );

    // Obtener ejercicios de cada día con datos del catálogo
    for (const dia of dias) {
      const [ejercicios] = await pool.query(
        `SELECT pde.id, pde.orden, pde.ejercicio_id, pde.series, pde.repeticiones, pde.notas,
                ce.nombre AS nombre_ejercicio, ce.grupo_muscular,
                ce.imagen_1_url, ce.imagen_2_url, ce.imagen_3_url
         FROM plantilla_dia_ejercicios pde
         JOIN catalogo_ejercicios ce ON pde.ejercicio_id = ce.id
         WHERE pde.plantilla_dia_id = ?
         ORDER BY pde.orden`,
        [dia.id]
      );
      dia.ejercicios = ejercicios;
    }

    plantilla.dias = dias;
    res.json(plantilla);
  } catch (error) {
    console.error('Error obteniendo plantilla:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear plantilla completa (con días y ejercicios en una sola transacción)
exports.crearPlantilla = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { nombre, categoria, descripcion, objetivo, nivel, dias } = req.body;

    if (!nombre || !categoria || !dias || !Array.isArray(dias)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Nombre, categoría y días son requeridos' });
    }

    // Insertar plantilla
    const [plantillaResult] = await connection.query(
      `INSERT INTO plantillas (nombre, categoria, descripcion, objetivo, nivel, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, categoria, descripcion || null, objetivo || null, nivel || 'Intermedio', req.user.id]
    );
    const plantillaId = plantillaResult.insertId;

    // Insertar días y ejercicios
    for (const dia of dias) {
      const [diaResult] = await connection.query(
        `INSERT INTO plantilla_dias (plantilla_id, numero_dia, nombre_dia, descripcion)
         VALUES (?, ?, ?, ?)`,
        [plantillaId, dia.numero_dia, dia.nombre_dia, dia.descripcion || null]
      );
      const diaId = diaResult.insertId;

      if (dia.ejercicios && Array.isArray(dia.ejercicios)) {
        for (const ej of dia.ejercicios) {
          await connection.query(
            `INSERT INTO plantilla_dia_ejercicios (plantilla_dia_id, ejercicio_id, orden, series, repeticiones, notas)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [diaId, ej.ejercicio_id, ej.orden, ej.series || null, ej.repeticiones || null, ej.notas || null]
          );
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Plantilla creada exitosamente',
      id: plantillaId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando plantilla:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

// Actualizar plantilla completa (reemplaza días y ejercicios)
exports.actualizarPlantilla = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nombre, categoria, descripcion, objetivo, nivel, dias } = req.body;

    // Verificar que existe
    const [existing] = await connection.query('SELECT id FROM plantillas WHERE id = ?', [id]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    // Actualizar cabecera
    const fields = [];
    const params = [];

    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
    if (categoria !== undefined) { fields.push('categoria = ?'); params.push(categoria); }
    if (descripcion !== undefined) { fields.push('descripcion = ?'); params.push(descripcion); }
    if (objetivo !== undefined) { fields.push('objetivo = ?'); params.push(objetivo); }
    if (nivel !== undefined) { fields.push('nivel = ?'); params.push(nivel); }

    if (fields.length > 0) {
      params.push(id);
      await connection.query(
        `UPDATE plantillas SET ${fields.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Si se proporcionan días, reemplazar toda la estructura
    if (dias && Array.isArray(dias)) {
      // Eliminar días existentes (cascade elimina ejercicios)
      await connection.query('DELETE FROM plantilla_dias WHERE plantilla_id = ?', [id]);

      for (const dia of dias) {
        const [diaResult] = await connection.query(
          `INSERT INTO plantilla_dias (plantilla_id, numero_dia, nombre_dia, descripcion)
           VALUES (?, ?, ?, ?)`,
          [id, dia.numero_dia, dia.nombre_dia, dia.descripcion || null]
        );
        const diaId = diaResult.insertId;

        if (dia.ejercicios && Array.isArray(dia.ejercicios)) {
          for (const ej of dia.ejercicios) {
            await connection.query(
              `INSERT INTO plantilla_dia_ejercicios (plantilla_dia_id, ejercicio_id, orden, series, repeticiones, notas)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [diaId, ej.ejercicio_id, ej.orden, ej.series || null, ej.repeticiones || null, ej.notas || null]
            );
          }
        }
      }
    }

    await connection.commit();
    res.json({ message: 'Plantilla actualizada exitosamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando plantilla:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

// Soft-delete plantilla
exports.eliminarPlantilla = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene asignaciones futuras activas
    const mesActual = new Date().toISOString().slice(0, 7);
    const [refs] = await pool.query(
      `SELECT COUNT(*) as total FROM asignaciones_plan
       WHERE plantilla_id = ? AND activo = 1 AND mes_anio >= ?`,
      [id, mesActual]
    );

    if (refs[0].total > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar: la plantilla tiene asignaciones activas para este mes o futuros',
        asignaciones_activas: refs[0].total
      });
    }

    const [result] = await pool.query(
      'UPDATE plantillas SET activo = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json({ message: 'Plantilla eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando plantilla:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Duplicar plantilla
exports.duplicarPlantilla = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { nombre } = req.body;

    // Obtener plantilla original
    const [plantillas] = await connection.query('SELECT * FROM plantillas WHERE id = ?', [id]);
    if (plantillas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const original = plantillas[0];
    const nuevoNombre = nombre || `${original.nombre} (copia)`;

    // Crear nueva plantilla
    const [newResult] = await connection.query(
      `INSERT INTO plantillas (nombre, categoria, descripcion, objetivo, nivel, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nuevoNombre, original.categoria, original.descripcion, original.objetivo, original.nivel, req.user.id]
    );
    const newPlantillaId = newResult.insertId;

    // Copiar días
    const [dias] = await connection.query(
      'SELECT * FROM plantilla_dias WHERE plantilla_id = ? ORDER BY numero_dia',
      [id]
    );

    for (const dia of dias) {
      const [newDiaResult] = await connection.query(
        `INSERT INTO plantilla_dias (plantilla_id, numero_dia, nombre_dia, descripcion)
         VALUES (?, ?, ?, ?)`,
        [newPlantillaId, dia.numero_dia, dia.nombre_dia, dia.descripcion]
      );
      const newDiaId = newDiaResult.insertId;

      // Copiar ejercicios del día
      const [ejercicios] = await connection.query(
        'SELECT * FROM plantilla_dia_ejercicios WHERE plantilla_dia_id = ? ORDER BY orden',
        [dia.id]
      );

      for (const ej of ejercicios) {
        await connection.query(
          `INSERT INTO plantilla_dia_ejercicios (plantilla_dia_id, ejercicio_id, orden, series, repeticiones, notas)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newDiaId, ej.ejercicio_id, ej.orden, ej.series, ej.repeticiones, ej.notas]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Plantilla duplicada exitosamente',
      id: newPlantillaId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error duplicando plantilla:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};
