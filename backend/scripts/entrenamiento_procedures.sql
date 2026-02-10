-- Procedimientos almacenados para planes de entrenamiento, días, ejercicios y registros
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_planes_participante$$
CREATE PROCEDURE sp_get_planes_participante(IN p_participante_id INT)
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
END$$

DROP PROCEDURE IF EXISTS sp_get_plan_header$$
CREATE PROCEDURE sp_get_plan_header(IN p_plan_id INT)
BEGIN
  SELECT p.*, part.nombre as participante_nombre, u.nombre as creador_nombre
  FROM planes_entrenamiento p
  INNER JOIN participantes part ON p.participante_id = part.id
  INNER JOIN usuarios u ON p.creado_por = u.id
  WHERE p.id = p_plan_id AND p.activo = TRUE;
END$$

DROP PROCEDURE IF EXISTS sp_get_dias_plan$$
CREATE PROCEDURE sp_get_dias_plan(IN p_plan_id INT)
BEGIN
  SELECT * FROM dias_entrenamiento
  WHERE plan_id = p_plan_id AND activo = TRUE
  ORDER BY numero_dia, orden;
END$$

DROP PROCEDURE IF EXISTS sp_get_ejercicios_dia$$
CREATE PROCEDURE sp_get_ejercicios_dia(IN p_dia_id INT)
BEGIN
  SELECT * FROM ejercicios_dia
  WHERE dia_id = p_dia_id AND activo = TRUE
  ORDER BY orden;
END$$

DROP PROCEDURE IF EXISTS sp_create_plan$$
CREATE PROCEDURE sp_create_plan(
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
END$$

DROP PROCEDURE IF EXISTS sp_update_plan$$
CREATE PROCEDURE sp_update_plan(
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
END$$

DROP PROCEDURE IF EXISTS sp_soft_delete_plan$$
CREATE PROCEDURE sp_soft_delete_plan(IN p_plan_id INT)
BEGIN
  UPDATE planes_entrenamiento SET activo = FALSE WHERE id = p_plan_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

-- Días
DROP PROCEDURE IF EXISTS sp_create_dia$$
CREATE PROCEDURE sp_create_dia(
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
END$$

DROP PROCEDURE IF EXISTS sp_update_dia$$
CREATE PROCEDURE sp_update_dia(
  IN p_dia_id INT,
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_notas TEXT
)
BEGIN
  UPDATE dias_entrenamiento SET nombre = p_nombre, descripcion = p_descripcion, notas = p_notas WHERE id = p_dia_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_soft_delete_dia$$
CREATE PROCEDURE sp_soft_delete_dia(IN p_dia_id INT)
BEGIN
  UPDATE dias_entrenamiento SET activo = FALSE WHERE id = p_dia_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

-- Ejercicios
DROP PROCEDURE IF EXISTS sp_create_ejercicio$$
CREATE PROCEDURE sp_create_ejercicio(
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
END$$

DROP PROCEDURE IF EXISTS sp_update_ejercicio$$
CREATE PROCEDURE sp_update_ejercicio(
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
END$$

DROP PROCEDURE IF EXISTS sp_soft_delete_ejercicio$$
CREATE PROCEDURE sp_soft_delete_ejercicio(IN p_ejercicio_id INT)
BEGIN
  UPDATE ejercicios_dia SET activo = FALSE WHERE id = p_ejercicio_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

-- Registros
DROP PROCEDURE IF EXISTS sp_create_registro$$
CREATE PROCEDURE sp_create_registro(
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
END$$

DROP PROCEDURE IF EXISTS sp_get_historial_ejercicio$$
CREATE PROCEDURE sp_get_historial_ejercicio(IN p_participante_id INT, IN p_ejercicio_dia_id INT)
BEGIN
  SELECT r.*, e.nombre_ejercicio, e.series as series_planificadas, e.repeticiones as reps_planificadas
  FROM registros_entrenamiento r
  INNER JOIN ejercicios_dia e ON r.ejercicio_dia_id = e.id
  WHERE r.participante_id = p_participante_id AND r.ejercicio_dia_id = p_ejercicio_dia_id
  ORDER BY r.fecha DESC;
END$$

DROP PROCEDURE IF EXISTS sp_get_progreso_participante$$
CREATE PROCEDURE sp_get_progreso_participante(
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
END$$

DELIMITER ;

-- Para instalar: mysql -u <user> -p <dbname> < backend/scripts/entrenamiento_procedures.sql
