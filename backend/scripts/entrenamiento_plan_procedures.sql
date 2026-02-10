-- Procedimientos almacenados para planes de entrenamiento (ejercicios_plan) y registros
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_plan_entrenamiento$$
CREATE PROCEDURE sp_get_plan_entrenamiento(IN p_participante_id INT, IN p_mes_año VARCHAR(20))
BEGIN
  SELECT * FROM planes_entrenamiento WHERE participante_id = p_participante_id AND mes_año = p_mes_año LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_get_ejercicios_plan$$
CREATE PROCEDURE sp_get_ejercicios_plan(IN p_plan_id INT)
BEGIN
  SELECT * FROM ejercicios_plan 
  WHERE plan_id = p_plan_id
  ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'), orden;
END$$

DROP PROCEDURE IF EXISTS sp_upsert_plan_entrenamiento$$
CREATE PROCEDURE sp_upsert_plan_entrenamiento(IN p_participante_id INT, IN p_mes_año VARCHAR(20), IN p_creado_por INT)
BEGIN
  DECLARE v_id INT;
  SELECT id INTO v_id FROM planes_entrenamiento WHERE participante_id = p_participante_id AND mes_año = p_mes_año LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE planes_entrenamiento SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = v_id;
    SELECT v_id AS plan_id, 0 AS is_new;
  ELSE
    INSERT INTO planes_entrenamiento (participante_id, mes_año, creado_por) VALUES (p_participante_id, p_mes_año, p_creado_por);
    SELECT LAST_INSERT_ID() AS plan_id, 1 AS is_new;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_delete_ejercicios_plan$$
CREATE PROCEDURE sp_delete_ejercicios_plan(IN p_plan_id INT)
BEGIN
  DELETE FROM ejercicios_plan WHERE plan_id = p_plan_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_get_planes_participante_list$$
CREATE PROCEDURE sp_get_planes_participante_list(IN p_participante_id INT)
BEGIN
  SELECT 
    pe.*, u.nombre as creado_por_nombre
  FROM planes_entrenamiento pe
  LEFT JOIN usuarios u ON pe.creado_por = u.id
  WHERE pe.participante_id = p_participante_id
  ORDER BY pe.mes_año DESC;
END$$

DROP PROCEDURE IF EXISTS sp_delete_plan_entrenamiento$$
CREATE PROCEDURE sp_delete_plan_entrenamiento(IN p_id INT)
BEGIN
  DELETE FROM planes_entrenamiento WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

-- Registros
DROP PROCEDURE IF EXISTS sp_insert_registro_plan$$
CREATE PROCEDURE sp_insert_registro_plan(
  IN p_participante_id INT,
  IN p_ejercicio_plan_id INT,
  IN p_fecha_registro DATETIME,
  IN p_peso_utilizado DECIMAL(10,2),
  IN p_series_completadas INT,
  IN p_repeticiones_completadas VARCHAR(255),
  IN p_comentarios TEXT
)
BEGIN
  INSERT INTO registros_entrenamiento (participante_id, ejercicio_plan_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas, comentarios)
  VALUES (p_participante_id, p_ejercicio_plan_id, p_fecha_registro, p_peso_utilizado, p_series_completadas, p_repeticiones_completadas, p_comentarios);
  SELECT LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_get_registros_plan$$
CREATE PROCEDURE sp_get_registros_plan(IN p_participante_id INT, IN p_fecha_inicio DATETIME, IN p_fecha_fin DATETIME)
BEGIN
  SELECT 
    re.*, ep.nombre_ejercicio, ep.dia_semana, ep.series as series_plan, ep.repeticiones as repeticiones_plan
  FROM registros_entrenamiento re
  JOIN ejercicios_plan ep ON re.ejercicio_plan_id = ep.id
  WHERE re.participante_id = p_participante_id
    AND (p_fecha_inicio IS NULL OR re.fecha_registro >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR re.fecha_registro <= p_fecha_fin)
  ORDER BY re.fecha_registro DESC, re.fecha_hora_registro DESC;
END$$

DROP PROCEDURE IF EXISTS sp_get_historial_ejercicio_plan$$
CREATE PROCEDURE sp_get_historial_ejercicio_plan(IN p_participante_id INT, IN p_ejercicio_plan_id INT)
BEGIN
  SELECT 
    re.*, ep.nombre_ejercicio, ep.dia_semana, ep.series as series_plan, ep.repeticiones as repeticiones_plan
  FROM registros_entrenamiento re
  JOIN ejercicios_plan ep ON re.ejercicio_plan_id = ep.id
  WHERE re.participante_id = p_participante_id AND re.ejercicio_plan_id = p_ejercicio_plan_id
  ORDER BY re.fecha_registro DESC, re.fecha_hora_registro DESC
  LIMIT 20;
END$$

DROP PROCEDURE IF EXISTS sp_get_ultimo_registro_plan$$
CREATE PROCEDURE sp_get_ultimo_registro_plan(IN p_participante_id INT, IN p_ejercicio_plan_id INT)
BEGIN
  SELECT * FROM registros_entrenamiento
  WHERE participante_id = p_participante_id AND ejercicio_plan_id = p_ejercicio_plan_id
  ORDER BY fecha_registro DESC, fecha_hora_registro DESC
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_update_registro_plan$$
CREATE PROCEDURE sp_update_registro_plan(
  IN p_id INT,
  IN p_peso_utilizado DECIMAL(10,2),
  IN p_series_completadas INT,
  IN p_repeticiones_completadas VARCHAR(255),
  IN p_comentarios TEXT
)
BEGIN
  UPDATE registros_entrenamiento 
  SET peso_utilizado = p_peso_utilizado, series_completadas = p_series_completadas, repeticiones_completadas = p_repeticiones_completadas, comentarios = p_comentarios
  WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_delete_registro_plan$$
CREATE PROCEDURE sp_delete_registro_plan(IN p_id INT)
BEGIN
  DELETE FROM registros_entrenamiento WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DELIMITER ;

-- Para instalar: mysql -u <user> -p <dbname> < backend/scripts/entrenamiento_plan_procedures.sql
