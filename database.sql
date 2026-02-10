-- Base de datos para Gimnasio VIGOROSO
-- Sistema de gestión de entrenamiento y nutrición

CREATE DATABASE IF NOT EXISTS vigoroso_gym;
USE vigoroso_gym;

--USE vigoroso_gym; UPDATE usuarios SET password='$2b$10$EXQr7doyqWbC6aVa2/mD3OLSgBOC8hRS00yyqIef2.NInkINjIZ5i' WHERE email='entrenador@gmail.com';


-- Tabla de Usuarios (Entrenadores y Administradores)
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'entrenador') DEFAULT 'entrenador',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Participantes
CREATE TABLE participantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    genero ENUM('M', 'F', 'Otro'),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    usuario_creador_id INT,
    FOREIGN KEY (usuario_creador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de Planes de Entrenamiento (Header - por mes)
CREATE TABLE planes_entrenamiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participante_id INT NOT NULL,
    mes_año VARCHAR(7) NOT NULL, -- Formato: YYYY-MM
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT,
    notas TEXT,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_plan_mes (participante_id, mes_año)
);

-- Tabla de Ejercicios del Plan (Detalle)
CREATE TABLE ejercicios_plan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_id INT NOT NULL,
    dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado') NOT NULL,
    orden INT NOT NULL, -- 1 a 6 para los 6 ejercicios
    nombre_ejercicio VARCHAR(200) NOT NULL,
    series VARCHAR(20), -- ej: "3-4"
    repeticiones VARCHAR(20), -- ej: "8-12"
    notas TEXT,
    FOREIGN KEY (plan_id) REFERENCES planes_entrenamiento(id) ON DELETE CASCADE,
    INDEX idx_plan_dia (plan_id, dia_semana)
);

-- Tabla de Registros de Entrenamiento (logs diarios)
CREATE TABLE registros_entrenamiento (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participante_id INT NOT NULL,
    ejercicio_plan_id INT NOT NULL,
    fecha_registro DATE NOT NULL,
    peso_utilizado DECIMAL(6,2), -- en kilogramos
    series_completadas INT,
    repeticiones_completadas INT,
    comentarios TEXT,
    fecha_hora_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    FOREIGN KEY (ejercicio_plan_id) REFERENCES ejercicios_plan(id) ON DELETE CASCADE,
    INDEX idx_participante_fecha (participante_id, fecha_registro)
);

-- Tabla de Planes de Nutrición
CREATE TABLE planes_nutricion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participante_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT,
    recomendaciones_generales TEXT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de Comidas del Plan de Nutrición
CREATE TABLE comidas_plan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plan_nutricion_id INT NOT NULL,
    tipo_comida ENUM('Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena') NOT NULL,
    opcion_1 TEXT,
    opcion_2 TEXT,
    FOREIGN KEY (plan_nutricion_id) REFERENCES planes_nutricion(id) ON DELETE CASCADE,
    INDEX idx_plan_tipo (plan_nutricion_id, tipo_comida)
);

-- Tabla de Mediciones y Progreso
CREATE TABLE mediciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participante_id INT NOT NULL,
    fecha_medicion DATE NOT NULL,
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    imc DECIMAL(5,2),
    porcentaje_grasa DECIMAL(5,2),
    masa_muscular DECIMAL(5,2),
    circunferencia_pecho DECIMAL(5,2),
    circunferencia_cintura DECIMAL(5,2),
    circunferencia_cadera DECIMAL(5,2),
    circunferencia_brazo DECIMAL(5,2),
    circunferencia_pierna DECIMAL(5,2),
    notas TEXT,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    INDEX idx_participante_fecha_med (participante_id, fecha_medicion)
);

-- Tabla de Asistencia
CREATE TABLE asistencia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participante_id INT NOT NULL,
    fecha_asistencia DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    INDEX idx_participante_fecha_asist (participante_id, fecha_asistencia)
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador VIGOROSO', 'admin@gmail.com', '$2b$10$YourHashedPasswordHere', 'admin');

-- Insertar datos de ejemplo (opcional)
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Entrenador Principal', 'entrenador@gmail.com', '$2b$10$YourHashedPasswordHere', 'entrenador');

-- Vistas útiles

-- Vista de resumen de participantes
CREATE VIEW vista_participantes_activos AS
SELECT 
    p.id,
    p.nombre,
    p.email,
    p.telefono,
    p.fecha_registro,
    COUNT(DISTINCT pe.id) as planes_entrenamiento,
    COUNT(DISTINCT pn.id) as planes_nutricion,
    u.nombre as creador
FROM participantes p
LEFT JOIN planes_entrenamiento pe ON p.id = pe.participante_id
LEFT JOIN planes_nutricion pn ON p.id = pn.participante_id
LEFT JOIN usuarios u ON p.usuario_creador_id = u.id
WHERE p.activo = TRUE
GROUP BY p.id;

-- Vista de entrenamientos recientes
CREATE VIEW vista_entrenamientos_recientes AS
SELECT 
    p.nombre as participante,
    re.fecha_registro,
    ep.nombre_ejercicio,
    ep.dia_semana,
    re.peso_utilizado,
    re.series_completadas,
    re.repeticiones_completadas
FROM registros_entrenamiento re
JOIN participantes p ON re.participante_id = p.id
JOIN ejercicios_plan ep ON re.ejercicio_plan_id = ep.id
ORDER BY re.fecha_registro DESC
LIMIT 100;

-- Procedimientos almacenados


DELIMITER //

-- Procedimiento para crear un plan de entrenamiento completo
CREATE PROCEDURE crear_plan_entrenamiento(
    IN p_participante_id INT,
    IN p_mes_año VARCHAR(7),
    IN p_creado_por INT
)
BEGIN
    DECLARE plan_id INT;
    
    -- Crear el plan
    INSERT INTO planes_entrenamiento (participante_id, mes_año, creado_por)
    VALUES (p_participante_id, p_mes_año, p_creado_por);
    
    SET plan_id = LAST_INSERT_ID();
    
    -- Crear ejercicios vacíos para cada día (6 ejercicios por día)
    INSERT INTO ejercicios_plan (plan_id, dia_semana, orden, nombre_ejercicio, series, repeticiones)
    SELECT plan_id, dia, num, '', '', ''
    FROM (
        SELECT 'Lunes' as dia UNION ALL
        SELECT 'Martes' UNION ALL
        SELECT 'Miércoles' UNION ALL
        SELECT 'Jueves' UNION ALL
        SELECT 'Viernes' UNION ALL
        SELECT 'Sábado'
    ) dias
    CROSS JOIN (
        SELECT 1 as num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
        SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
    ) numeros;
    
    SELECT plan_id;
END //

-- Procedimiento para obtener progreso de un participante
CREATE PROCEDURE obtener_progreso_participante(
    IN p_participante_id INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT 
        fecha_registro,
        COUNT(DISTINCT ejercicio_plan_id) as ejercicios_realizados,
        AVG(peso_utilizado) as peso_promedio,
        SUM(series_completadas * repeticiones_completadas) as volumen_total
    FROM registros_entrenamiento
    WHERE participante_id = p_participante_id
        AND fecha_registro BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY fecha_registro
    ORDER BY fecha_registro;
END //

DELIMITER ;

-- Índices adicionales para optimización
CREATE INDEX idx_ejercicios_plan ON ejercicios_plan(plan_id, dia_semana, orden);
CREATE INDEX idx_registros_fecha ON registros_entrenamiento(fecha_registro);
CREATE INDEX idx_participantes_activos ON participantes(activo, fecha_registro);
