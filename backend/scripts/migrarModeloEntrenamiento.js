/**
 * Script de migración: Preparar BD para el modelo jerárquico de entrenamiento
 * Añade columnas a tablas existentes, crea tablas nuevas y registra stored procedures.
 *
 * Ejecutar: node backend/scripts/migrarModeloEntrenamiento.js
 *
 * Idempotente: puede ejecutarse varias veces sin romper datos existentes.
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function runQuery(connection, sql, label) {
  try {
    await connection.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    // Ignorar errores "column already exists" o "table already exists"
    if (
      err.code === 'ER_DUP_FIELDNAME' ||
      err.code === 'ER_TABLE_EXISTS_ERROR' ||
      (err.message && err.message.includes('Duplicate column name'))
    ) {
      console.log(`  ~ ${label} (ya existe, omitido)`);
    } else {
      throw err;
    }
  }
}

async function migrar() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'vigoroso_gym',
      port: process.env.DB_PORT || 3306,
      multipleStatements: false
    });

    console.log('Conectado a la base de datos');
    console.log('\n════════════════════════════════════');
    console.log('  PASO 1: ALTER planes_entrenamiento');
    console.log('════════════════════════════════════');

    const alterPlanes = [
      ["MODIFY mes_año VARCHAR(7) DEFAULT NULL",              "MODIFY planes_entrenamiento.mes_año → nullable"],
      ["ADD COLUMN nombre VARCHAR(255) DEFAULT NULL",         "ALTER planes_entrenamiento: nombre"],
      ["ADD COLUMN descripcion TEXT DEFAULT NULL",            "ALTER planes_entrenamiento: descripcion"],
      ["ADD COLUMN objetivo VARCHAR(255) DEFAULT NULL",       "ALTER planes_entrenamiento: objetivo"],
      ["ADD COLUMN nivel ENUM('Principiante','Intermedio','Avanzado') DEFAULT 'Intermedio'", "ALTER planes_entrenamiento: nivel"],
      ["ADD COLUMN duracion_semanas INT DEFAULT NULL",        "ALTER planes_entrenamiento: duracion_semanas"],
      ["ADD COLUMN fecha_inicio DATE DEFAULT NULL",           "ALTER planes_entrenamiento: fecha_inicio"],
      ["ADD COLUMN fecha_fin DATE DEFAULT NULL",              "ALTER planes_entrenamiento: fecha_fin"],
      ["ADD COLUMN activo BOOLEAN DEFAULT TRUE",              "ALTER planes_entrenamiento: activo"],
    ];

    for (const [clause, label] of alterPlanes) {
      await runQuery(connection, `ALTER TABLE planes_entrenamiento ${clause}`, label);
    }

    console.log('\n════════════════════════════════════');
    console.log('  PASO 2: CREATE TABLE dias_entrenamiento');
    console.log('════════════════════════════════════');

    await runQuery(connection, `
      CREATE TABLE IF NOT EXISTS dias_entrenamiento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_id INT NOT NULL,
        numero_dia INT NOT NULL,
        nombre VARCHAR(255) DEFAULT NULL,
        descripcion TEXT DEFAULT NULL,
        notas TEXT DEFAULT NULL,
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES planes_entrenamiento(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, 'CREATE TABLE dias_entrenamiento');

    console.log('\n════════════════════════════════════');
    console.log('  PASO 3: CREATE TABLE ejercicios_dia');
    console.log('════════════════════════════════════');

    await runQuery(connection, `
      CREATE TABLE IF NOT EXISTS ejercicios_dia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dia_id INT NOT NULL,
        nombre_ejercicio VARCHAR(255) NOT NULL,
        series INT DEFAULT NULL,
        repeticiones VARCHAR(50) DEFAULT NULL,
        peso DECIMAL(10,2) DEFAULT NULL,
        descanso VARCHAR(50) DEFAULT NULL,
        notas TEXT DEFAULT NULL,
        video_url VARCHAR(512) DEFAULT NULL,
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dia_id) REFERENCES dias_entrenamiento(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, 'CREATE TABLE ejercicios_dia');

    console.log('\n════════════════════════════════════');
    console.log('  PASO 4: ALTER registros_entrenamiento');
    console.log('════════════════════════════════════');

    // Hacer nullable ejercicio_plan_id (puede fallar si la columna no existe; se ignora)
    await runQuery(connection,
      'ALTER TABLE registros_entrenamiento MODIFY ejercicio_plan_id INT NULL',
      'MODIFY registros_entrenamiento.ejercicio_plan_id → nullable'
    );

    const alterRegistros = [
      ["ADD COLUMN ejercicio_dia_id INT DEFAULT NULL",            "ADD registros_entrenamiento.ejercicio_dia_id"],
      ["ADD COLUMN fecha DATE DEFAULT NULL",                      "ADD registros_entrenamiento.fecha"],
      ["ADD COLUMN repeticiones_reales VARCHAR(255) DEFAULT NULL","ADD registros_entrenamiento.repeticiones_reales"],
      ["ADD COLUMN dificultad VARCHAR(50) DEFAULT NULL",          "ADD registros_entrenamiento.dificultad"],
      ["ADD COLUMN notas TEXT DEFAULT NULL",                      "ADD registros_entrenamiento.notas"],
    ];

    for (const [clause, label] of alterRegistros) {
      await runQuery(connection, `ALTER TABLE registros_entrenamiento ${clause}`, label);
    }

    // FK ejercicio_dia_id → ejercicios_dia (solo si la tabla existe y la columna fue creada)
    try {
      await connection.query(`
        ALTER TABLE registros_entrenamiento
          ADD CONSTRAINT fk_registro_ejercicio_dia
          FOREIGN KEY (ejercicio_dia_id) REFERENCES ejercicios_dia(id) ON DELETE SET NULL
      `);
      console.log('  ✓ FK registros_entrenamiento.ejercicio_dia_id → ejercicios_dia');
    } catch (err) {
      if (err.code === 'ER_DUP_KEY' || err.errno === 1826 || (err.message && err.message.includes('Duplicate key name'))) {
        console.log('  ~ FK ejercicio_dia_id (ya existe, omitida)');
      } else if (err.errno === 1215 || err.errno === 1005) {
        // Cannot add FK — posiblemente tabla creada sin datos aún
        console.log('  ~ FK ejercicio_dia_id omitida:', err.message);
      } else {
        // No bloquear migración por FK
        console.log('  ! FK ejercicio_dia_id advertencia:', err.message);
      }
    }

    // ─────────────────────────────────────────────
    // PASO 5: Stored Procedures
    // ─────────────────────────────────────────────
    console.log('\n════════════════════════════════════');
    console.log('  PASO 5: Stored Procedures');
    console.log('════════════════════════════════════');

    const procedures = [
      {
        name: 'sp_get_planes_participante',
        sql: `CREATE PROCEDURE sp_get_planes_participante(IN p_participante_id INT)
BEGIN
  SELECT
    p.*,
    u.nombre as creador_nombre,
    COUNT(DISTINCT d.id) as total_dias,
    COUNT(DISTINCT e.id) as total_ejercicios
  FROM planes_entrenamiento p
  LEFT JOIN usuarios u ON p.creado_por = u.id
  LEFT JOIN dias_entrenamiento d ON p.id = d.plan_id AND d.activo = TRUE
  LEFT JOIN ejercicios_dia e ON d.id = e.dia_id AND e.activo = TRUE
  WHERE p.participante_id = p_participante_id AND p.activo = TRUE
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC;
END`
      },
      {
        name: 'sp_get_plan_header',
        sql: `CREATE PROCEDURE sp_get_plan_header(IN p_plan_id INT)
BEGIN
  SELECT p.*, part.nombre as participante_nombre, u.nombre as creador_nombre
  FROM planes_entrenamiento p
  INNER JOIN participantes part ON p.participante_id = part.id
  INNER JOIN usuarios u ON p.creado_por = u.id
  WHERE p.id = p_plan_id AND p.activo = TRUE;
END`
      },
      {
        name: 'sp_get_dias_plan',
        sql: `CREATE PROCEDURE sp_get_dias_plan(IN p_plan_id INT)
BEGIN
  SELECT * FROM dias_entrenamiento
  WHERE plan_id = p_plan_id AND activo = TRUE
  ORDER BY numero_dia, orden;
END`
      },
      {
        name: 'sp_get_ejercicios_dia',
        sql: `CREATE PROCEDURE sp_get_ejercicios_dia(IN p_dia_id INT)
BEGIN
  SELECT * FROM ejercicios_dia
  WHERE dia_id = p_dia_id AND activo = TRUE
  ORDER BY orden;
END`
      },
      {
        name: 'sp_create_plan',
        sql: `CREATE PROCEDURE sp_create_plan(
  IN p_participante_id INT,
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_objetivo VARCHAR(255),
  IN p_nivel VARCHAR(50),
  IN p_duracion_semanas INT,
  IN p_fecha_inicio DATE,
  IN p_creado_por INT
)
BEGIN
  INSERT INTO planes_entrenamiento
    (participante_id, nombre, descripcion, objetivo, nivel, duracion_semanas, fecha_inicio, creado_por)
  VALUES (p_participante_id, p_nombre, p_descripcion, p_objetivo, p_nivel, p_duracion_semanas, p_fecha_inicio, p_creado_por);
  SELECT LAST_INSERT_ID() AS insertId;
END`
      },
      {
        name: 'sp_update_plan',
        sql: `CREATE PROCEDURE sp_update_plan(
  IN p_plan_id INT,
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_objetivo VARCHAR(255),
  IN p_nivel VARCHAR(50),
  IN p_duracion_semanas INT,
  IN p_fecha_inicio DATE,
  IN p_fecha_fin DATE
)
BEGIN
  UPDATE planes_entrenamiento
  SET nombre = p_nombre, descripcion = p_descripcion, objetivo = p_objetivo, nivel = p_nivel,
      duracion_semanas = p_duracion_semanas, fecha_inicio = p_fecha_inicio, fecha_fin = p_fecha_fin
  WHERE id = p_plan_id AND activo = TRUE;
  SELECT ROW_COUNT() AS affectedRows;
END`
      },
      {
        name: 'sp_soft_delete_plan',
        sql: `CREATE PROCEDURE sp_soft_delete_plan(IN p_plan_id INT)
BEGIN
  UPDATE planes_entrenamiento SET activo = FALSE WHERE id = p_plan_id;
  SELECT ROW_COUNT() AS affectedRows;
END`
      },
      {
        name: 'sp_create_dia',
        sql: `CREATE PROCEDURE sp_create_dia(
  IN p_plan_id INT,
  IN p_numero_dia INT,
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_notas TEXT,
  IN p_orden INT
)
BEGIN
  INSERT INTO dias_entrenamiento (plan_id, numero_dia, nombre, descripcion, notas, orden)
  VALUES (p_plan_id, p_numero_dia, p_nombre, p_descripcion, p_notas, p_orden);
  SELECT LAST_INSERT_ID() AS insertId;
END`
      },
      {
        name: 'sp_update_dia',
        sql: `CREATE PROCEDURE sp_update_dia(
  IN p_dia_id INT,
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_notas TEXT
)
BEGIN
  UPDATE dias_entrenamiento SET nombre = p_nombre, descripcion = p_descripcion, notas = p_notas WHERE id = p_dia_id;
  SELECT ROW_COUNT() AS affectedRows;
END`
      },
      {
        name: 'sp_soft_delete_dia',
        sql: `CREATE PROCEDURE sp_soft_delete_dia(IN p_dia_id INT)
BEGIN
  UPDATE dias_entrenamiento SET activo = FALSE WHERE id = p_dia_id;
  SELECT ROW_COUNT() AS affectedRows;
END`
      },
      {
        name: 'sp_create_ejercicio',
        sql: `CREATE PROCEDURE sp_create_ejercicio(
  IN p_dia_id INT,
  IN p_nombre_ejercicio VARCHAR(255),
  IN p_series INT,
  IN p_repeticiones VARCHAR(50),
  IN p_peso DECIMAL(10,2),
  IN p_descanso VARCHAR(50),
  IN p_notas TEXT,
  IN p_video_url VARCHAR(512),
  IN p_orden INT
)
BEGIN
  INSERT INTO ejercicios_dia (dia_id, nombre_ejercicio, series, repeticiones, peso, descanso, notas, video_url, orden)
  VALUES (p_dia_id, p_nombre_ejercicio, p_series, p_repeticiones, p_peso, p_descanso, p_notas, p_video_url, p_orden);
  SELECT LAST_INSERT_ID() AS insertId;
END`
      },
      {
        name: 'sp_update_ejercicio',
        sql: `CREATE PROCEDURE sp_update_ejercicio(
  IN p_ejercicio_id INT,
  IN p_nombre_ejercicio VARCHAR(255),
  IN p_series INT,
  IN p_repeticiones VARCHAR(50),
  IN p_peso DECIMAL(10,2),
  IN p_descanso VARCHAR(50),
  IN p_notas TEXT,
  IN p_video_url VARCHAR(512),
  IN p_orden INT
)
BEGIN
  UPDATE ejercicios_dia SET nombre_ejercicio = p_nombre_ejercicio, series = p_series, repeticiones = p_repeticiones,
    peso = p_peso, descanso = p_descanso, notas = p_notas, video_url = p_video_url, orden = p_orden
  WHERE id = p_ejercicio_id;
  SELECT ROW_COUNT() AS affectedRows;
END`
      },
      {
        name: 'sp_soft_delete_ejercicio',
        sql: `CREATE PROCEDURE sp_soft_delete_ejercicio(IN p_ejercicio_id INT)
BEGIN
  UPDATE ejercicios_dia SET activo = FALSE WHERE id = p_ejercicio_id;
  SELECT ROW_COUNT() AS affectedRows;
END`
      },
      {
        name: 'sp_create_registro',
        sql: `CREATE PROCEDURE sp_create_registro(
  IN p_participante_id INT,
  IN p_ejercicio_dia_id INT,
  IN p_fecha DATETIME,
  IN p_series_completadas INT,
  IN p_repeticiones_reales VARCHAR(255),
  IN p_peso_utilizado DECIMAL(10,2),
  IN p_dificultad VARCHAR(50),
  IN p_notas TEXT
)
BEGIN
  INSERT INTO registros_entrenamiento (participante_id, ejercicio_dia_id, fecha, series_completadas, repeticiones_reales, peso_utilizado, dificultad, notas)
  VALUES (p_participante_id, p_ejercicio_dia_id, p_fecha, p_series_completadas, p_repeticiones_reales, p_peso_utilizado, p_dificultad, p_notas);
  SELECT LAST_INSERT_ID() AS insertId;
END`
      },
      {
        name: 'sp_get_historial_ejercicio',
        sql: `CREATE PROCEDURE sp_get_historial_ejercicio(IN p_participante_id INT, IN p_ejercicio_dia_id INT)
BEGIN
  SELECT r.*, e.nombre_ejercicio, e.series as series_planificadas, e.repeticiones as reps_planificadas
  FROM registros_entrenamiento r
  INNER JOIN ejercicios_dia e ON r.ejercicio_dia_id = e.id
  WHERE r.participante_id = p_participante_id AND r.ejercicio_dia_id = p_ejercicio_dia_id
  ORDER BY r.fecha DESC;
END`
      },
      {
        name: 'sp_get_progreso_participante',
        sql: `CREATE PROCEDURE sp_get_progreso_participante(
  IN p_participante_id INT,
  IN p_plan_id INT,
  IN p_fecha_inicio DATETIME,
  IN p_fecha_fin DATETIME
)
BEGIN
  SELECT
    d.numero_dia,
    d.nombre as dia_nombre,
    e.nombre_ejercicio,
    e.series as series_planificadas,
    e.repeticiones as reps_planificadas,
    COUNT(r.id) as veces_realizado,
    AVG(r.series_completadas) as promedio_series,
    MAX(r.fecha) as ultima_vez
  FROM planes_entrenamiento p
  INNER JOIN dias_entrenamiento d ON p.id = d.plan_id
  INNER JOIN ejercicios_dia e ON d.id = e.dia_id
  LEFT JOIN registros_entrenamiento r ON e.id = r.ejercicio_dia_id AND r.participante_id = p_participante_id
  WHERE p.id = p_plan_id AND p.participante_id = p_participante_id
  AND (p_fecha_inicio IS NULL OR r.fecha >= p_fecha_inicio)
  AND (p_fecha_fin IS NULL OR r.fecha <= p_fecha_fin)
  GROUP BY d.id, e.id
  ORDER BY d.numero_dia, e.orden;
END`
      }
    ];

    for (const proc of procedures) {
      // DROP siempre (idempotente)
      await connection.query(`DROP PROCEDURE IF EXISTS ${proc.name}`);
      await connection.query(proc.sql);
      console.log(`  ✓ ${proc.name}`);
    }

    console.log('\n════════════════════════════════════');
    console.log('  Migración completada exitosamente');
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('\nError en migración:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

migrar()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
