-- Procedimientos almacenados para planes de nutrición y comidas
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_plan_nutricion$$
CREATE PROCEDURE sp_get_plan_nutricion(IN p_participante_id INT)
BEGIN
  SELECT * FROM planes_nutricion 
  WHERE participante_id = p_participante_id AND activo = TRUE
  ORDER BY fecha_creacion DESC
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_get_comidas_plan$$
CREATE PROCEDURE sp_get_comidas_plan(IN p_plan_id INT)
BEGIN
  SELECT * FROM comidas_plan
  WHERE plan_nutricion_id = p_plan_id
  ORDER BY FIELD(tipo_comida, 'Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena');
END$$

DROP PROCEDURE IF EXISTS sp_create_plan_nutricion$$
CREATE PROCEDURE sp_create_plan_nutricion(
  IN p_participante_id INT,
  IN p_creado_por INT,
  IN p_recomendaciones TEXT
)
BEGIN
  -- Desactivar planes anteriores
  UPDATE planes_nutricion SET activo = FALSE WHERE participante_id = p_participante_id;

  -- Crear nuevo plan
  INSERT INTO planes_nutricion (participante_id, creado_por, recomendaciones_generales, activo)
  VALUES (p_participante_id, p_creado_por, p_recomendaciones, TRUE);

  SELECT LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_historial_planes$$
CREATE PROCEDURE sp_obtener_historial_planes(IN p_participante_id INT)
BEGIN
  SELECT 
    pn.*,
    u.nombre as creado_por_nombre
  FROM planes_nutricion pn
  LEFT JOIN usuarios u ON pn.creado_por = u.id
  WHERE pn.participante_id = p_participante_id
  ORDER BY pn.fecha_creacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_plan$$
CREATE PROCEDURE sp_eliminar_plan(IN p_id INT)
BEGIN
  DELETE FROM planes_nutricion WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_plan_recomendaciones$$
CREATE PROCEDURE sp_actualizar_plan_recomendaciones(IN p_id INT, IN p_recomendaciones TEXT)
BEGIN
  UPDATE planes_nutricion 
  SET recomendaciones_generales = p_recomendaciones, fecha_actualizacion = CURRENT_TIMESTAMP
  WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DELIMITER ;

-- Para instalar: mysql -u <user> -p <dbname> < backend/scripts/nutricion_procedures.sql
