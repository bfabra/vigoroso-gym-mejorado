const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Listar ejercicios del catálogo con filtros opcionales
exports.listarEjercicios = async (req, res) => {
  try {
    const { grupo_muscular, search, activo } = req.query;
    let query = 'SELECT * FROM catalogo_ejercicios WHERE 1=1';
    const params = [];

    if (activo !== undefined) {
      query += ' AND activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    } else {
      query += ' AND activo = 1';
    }

    if (grupo_muscular) {
      query += ' AND grupo_muscular = ?';
      params.push(grupo_muscular);
    }

    if (search) {
      query += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY grupo_muscular, nombre';

    const [ejercicios] = await pool.query(query, params);
    res.json(ejercicios);
  } catch (error) {
    console.error('Error listando catálogo:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Obtener un ejercicio por ID
exports.obtenerEjercicio = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM catalogo_ejercicios WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error obteniendo ejercicio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Crear ejercicio en el catálogo
exports.crearEjercicio = async (req, res) => {
  try {
    const { nombre, grupo_muscular, instrucciones } = req.body;

    if (!nombre || !grupo_muscular) {
      return res.status(400).json({ error: 'Nombre y grupo muscular son requeridos' });
    }

    const [result] = await pool.query(
      'INSERT INTO catalogo_ejercicios (nombre, grupo_muscular, instrucciones) VALUES (?, ?, ?)',
      [nombre, grupo_muscular, instrucciones || null]
    );

    res.status(201).json({
      message: 'Ejercicio creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un ejercicio con ese nombre' });
    }
    console.error('Error creando ejercicio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Actualizar ejercicio del catálogo
exports.actualizarEjercicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, grupo_muscular, instrucciones } = req.body;

    const fields = [];
    const params = [];

    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
    if (grupo_muscular !== undefined) { fields.push('grupo_muscular = ?'); params.push(grupo_muscular); }
    if (instrucciones !== undefined) { fields.push('instrucciones = ?'); params.push(instrucciones); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    params.push(id);
    const [result] = await pool.query(
      `UPDATE catalogo_ejercicios SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    res.json({ message: 'Ejercicio actualizado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un ejercicio con ese nombre' });
    }
    console.error('Error actualizando ejercicio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Soft-delete ejercicio del catálogo
exports.eliminarEjercicio = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si está en plantillas activas
    const [refs] = await pool.query(
      `SELECT COUNT(*) as total FROM plantilla_dia_ejercicios pde
       JOIN plantilla_dias pd ON pde.plantilla_dia_id = pd.id
       JOIN plantillas p ON pd.plantilla_id = p.id
       WHERE pde.ejercicio_id = ? AND p.activo = 1`,
      [id]
    );

    if (refs[0].total > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar: el ejercicio está en plantillas activas',
        plantillas_activas: refs[0].total
      });
    }

    const [result] = await pool.query(
      'UPDATE catalogo_ejercicios SET activo = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    res.json({ message: 'Ejercicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando ejercicio:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Subir imagen al catálogo (slot 1, 2 o 3)
exports.subirImagenCatalogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó imagen' });
    }

    const { id } = req.params;
    const imagen_url = `/api/uploads/ejercicios/${req.file.filename}`;

    // Buscar el primer slot vacío
    const [rows] = await pool.query(
      'SELECT imagen_1_url, imagen_2_url, imagen_3_url FROM catalogo_ejercicios WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      // Limpiar archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    const ejercicio = rows[0];
    let slot = null;

    if (!ejercicio.imagen_1_url) slot = 'imagen_1_url';
    else if (!ejercicio.imagen_2_url) slot = 'imagen_2_url';
    else if (!ejercicio.imagen_3_url) slot = 'imagen_3_url';
    else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El ejercicio ya tiene 3 imágenes. Elimina una primero.' });
    }

    await pool.query(
      `UPDATE catalogo_ejercicios SET ${slot} = ? WHERE id = ?`,
      [imagen_url, id]
    );

    res.json({
      message: 'Imagen subida exitosamente',
      imagen_url,
      slot
    });
  } catch (error) {
    console.error('Error subiendo imagen al catálogo:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
};

// Eliminar imagen del catálogo por slot
exports.eliminarImagenCatalogo = async (req, res) => {
  try {
    const { id, slot } = req.params;

    if (!['1', '2', '3'].includes(slot)) {
      return res.status(400).json({ error: 'Slot inválido. Debe ser 1, 2 o 3' });
    }

    const column = `imagen_${slot}_url`;

    const [rows] = await pool.query(
      `SELECT ${column} FROM catalogo_ejercicios WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    const imagen_url = rows[0][column];
    if (imagen_url) {
      const filename = path.basename(imagen_url);
      const filePath = path.join(__dirname, '..', 'uploads', 'ejercicios', filename);
      const uploadsDir = path.resolve(path.join(__dirname, '..', 'uploads', 'ejercicios'));
      const resolvedPath = path.resolve(filePath);

      if (resolvedPath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query(
      `UPDATE catalogo_ejercicios SET ${column} = NULL WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando imagen del catálogo:', error);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
};
