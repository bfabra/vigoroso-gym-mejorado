-- Procedimientos almacenados para la entidad participantes
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_participantes_count$$
CREATE PROCEDURE sp_get_participantes_count()
BEGIN
  SELECT COUNT(*) AS total FROM participantes WHERE activo = TRUE;
END$$

DROP PROCEDURE IF EXISTS sp_get_participantes$$
CREATE PROCEDURE sp_get_participantes(IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT
    p.*,
    COUNT(DISTINCT pe.id) AS total_planes_entrenamiento,
    COUNT(DISTINCT pn.id) AS total_planes_nutricion
  FROM participantes p
  LEFT JOIN planes_entrenamiento pe ON p.id = pe.participante_id
  LEFT JOIN planes_nutricion pn ON p.id = pn.participante_id
  WHERE p.activo = TRUE
  GROUP BY p.id
  ORDER BY p.fecha_registro DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_get_participante$$
CREATE PROCEDURE sp_get_participante(IN p_id INT)
BEGIN
  SELECT * FROM participantes WHERE id = p_id AND activo = TRUE;
END$$

DROP PROCEDURE IF EXISTS sp_create_participante$$
CREATE PROCEDURE sp_create_participante(
  IN p_nombre VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_telefono VARCHAR(50),
  IN p_fecha_nacimiento DATE,
  IN p_genero VARCHAR(20),
  IN p_usuario_creador_id INT
)
BEGIN
  INSERT INTO participantes (nombre, email, password, telefono, fecha_nacimiento, genero, usuario_creador_id)
  VALUES (p_nombre, p_email, p_password, p_telefono, p_fecha_nacimiento, p_genero, p_usuario_creador_id);
  SELECT LAST_INSERT_ID() AS insertId;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_participante$$
CREATE PROCEDURE sp_actualizar_participante(
  IN p_id INT,
  IN p_nombre VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_telefono VARCHAR(50),
  IN p_fecha_nacimiento DATE,
  IN p_genero VARCHAR(20)
)
BEGIN
  UPDATE participantes
  SET nombre = p_nombre, email = p_email, telefono = p_telefono, fecha_nacimiento = p_fecha_nacimiento, genero = p_genero
  WHERE id = p_id AND activo = TRUE;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_participante$$
CREATE PROCEDURE sp_eliminar_participante(IN p_id INT)
BEGIN
  UPDATE participantes SET activo = FALSE WHERE id = p_id;
  SELECT ROW_COUNT() AS affectedRows;
END$$

DROP PROCEDURE IF EXISTS sp_cambiar_password$$
CREATE PROCEDURE sp_cambiar_password(IN p_id INT, IN p_password VARCHAR(255))
BEGIN
  UPDATE participantes SET password = p_password WHERE id = p_id AND activo = TRUE;
  SELECT ROW_COUNT() AS affectedRows;
END$$

-- Reactivar participante si existe inactivo

use vigoroso_gym;
DROP PROCEDURE IF EXISTS sp_reactivar_participante$$
CREATE PROCEDURE sp_reactivar_participante(
  IN p_email VARCHAR(255),
  IN p_nombre VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_telefono VARCHAR(50),
  IN p_fecha_nacimiento DATE,
  IN p_genero VARCHAR(20),
  IN p_usuario_reactivo_id INT
)
BEGIN
  DECLARE v_id INT;
  DECLARE v_activo BOOLEAN;

  SELECT id, activo INTO v_id, v_activo FROM participantes WHERE email = p_email LIMIT 1;

  IF v_id IS NOT NULL AND v_activo = FALSE THEN
    UPDATE participantes
      SET nombre = p_nombre,
          password = p_password,
          telefono = p_telefono,
          fecha_nacimiento = p_fecha_nacimiento,
          genero = p_genero,
          activo = TRUE,
          fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = v_id;

    SELECT v_id AS id, ROW_COUNT() AS affectedRows;
  ELSE
    SELECT 0 AS id, 0 AS affectedRows;
  END IF;
END$$

DELIMITER ;

-- Para instalar: ejecutar este archivo en la base de datos (por ejemplo: mysql -u user -p dbname < participantes_procedures.sql)
