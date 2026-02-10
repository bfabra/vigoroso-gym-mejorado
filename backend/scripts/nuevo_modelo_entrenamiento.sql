-- ========================================
-- NUEVO MODELO DE PLANES DE ENTRENAMIENTO
-- ========================================

-- Tabla principal de planes de entrenamiento
-- Ahora es más simple, solo info general del plan
DROP TABLE IF EXISTS ejercicios_plan;
DROP TABLE IF EXISTS planes_entrenamiento;

CREATE TABLE planes_entrenamiento (
  id INT PRIMARY KEY AUTO_INCREMENT,
  participante_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  objetivo VARCHAR(100), -- Ejemplo: "Hipertrofia", "Fuerza", "Definición"
  nivel VARCHAR(50), -- "Principiante", "Intermedio", "Avanzado"
  duracion_semanas INT DEFAULT 4,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT TRUE,
  creado_por INT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (participante_id) REFERENCES participantes(id),
  FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  INDEX idx_participante (participante_id),
  INDEX idx_activo (activo)
);

-- Tabla de días de entrenamiento
-- Cada plan tiene varios días (Día 1, Día 2, etc.)
CREATE TABLE dias_entrenamiento (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plan_id INT NOT NULL,
  numero_dia INT NOT NULL, -- 1, 2, 3, 4, etc.
  nombre VARCHAR(100) NOT NULL, -- "Día 1 - Espalda y Bíceps", "Push Day", etc.
  descripcion TEXT,
  notas TEXT, -- Notas generales para el día
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (plan_id) REFERENCES planes_entrenamiento(id) ON DELETE CASCADE,
  INDEX idx_plan (plan_id),
  INDEX idx_numero_dia (numero_dia),
  UNIQUE KEY unique_plan_dia (plan_id, numero_dia)
);

-- Tabla de ejercicios dentro de cada día
CREATE TABLE ejercicios_dia (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dia_id INT NOT NULL,
  nombre_ejercicio VARCHAR(150) NOT NULL,
  series INT NOT NULL,
  repeticiones VARCHAR(50) NOT NULL, -- Puede ser "10", "8-12", "al fallo", etc.
  peso VARCHAR(50), -- "60kg", "Peso corporal", "Progresivo", etc.
  descanso VARCHAR(50), -- "60 seg", "90-120 seg", etc.
  notas TEXT, -- Instrucciones específicas del ejercicio
  video_url VARCHAR(255), -- URL a video demostrativo (opcional)
  orden INT NOT NULL, -- Orden del ejercicio en el día
  activo BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (dia_id) REFERENCES dias_entrenamiento(id) ON DELETE CASCADE,
  INDEX idx_dia (dia_id),
  INDEX idx_orden (orden)
);

-- Tabla de registros de entrenamiento (cuando el participante completa un ejercicio)
DROP TABLE IF EXISTS registros_entrenamiento;

CREATE TABLE registros_entrenamiento (
  id INT PRIMARY KEY AUTO_INCREMENT,
  participante_id INT NOT NULL,
  ejercicio_dia_id INT NOT NULL,
  fecha DATE NOT NULL,
  series_completadas INT,
  repeticiones_reales VARCHAR(100), -- "10,10,9,8" para cada serie
  peso_utilizado VARCHAR(50),
  dificultad ENUM('Fácil', 'Moderado', 'Difícil', 'Muy Difícil'),
  notas TEXT,
  completado BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (participante_id) REFERENCES participantes(id),
  FOREIGN KEY (ejercicio_dia_id) REFERENCES ejercicios_dia(id) ON DELETE CASCADE,
  INDEX idx_participante_fecha (participante_id, fecha),
  INDEX idx_ejercicio (ejercicio_dia_id)
);

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista para obtener un plan completo con todos sus días y ejercicios
CREATE OR REPLACE VIEW vista_planes_completos AS
SELECT 
  p.id as plan_id,
  p.nombre as plan_nombre,
  p.descripcion as plan_descripcion,
  p.objetivo,
  p.nivel,
  p.duracion_semanas,
  p.participante_id,
  part.nombre as participante_nombre,
  d.id as dia_id,
  d.numero_dia,
  d.nombre as dia_nombre,
  d.notas as dia_notas,
  e.id as ejercicio_id,
  e.nombre_ejercicio,
  e.series,
  e.repeticiones,
  e.peso,
  e.descanso,
  e.notas as ejercicio_notas,
  e.orden,
  u.nombre as creado_por_nombre
FROM planes_entrenamiento p
INNER JOIN participantes part ON p.participante_id = part.id
LEFT JOIN dias_entrenamiento d ON p.id = d.plan_id AND d.activo = TRUE
LEFT JOIN ejercicios_dia e ON d.id = e.dia_id AND e.activo = TRUE
LEFT JOIN usuarios u ON p.creado_por = u.id
WHERE p.activo = TRUE
ORDER BY p.id, d.numero_dia, e.orden;

-- ========================================
-- DATOS DE EJEMPLO
-- ========================================

-- Insertar un plan de ejemplo (asumiendo que existe participante con id=1 y usuario con id=1)
INSERT INTO planes_entrenamiento (participante_id, nombre, descripcion, objetivo, nivel, duracion_semanas, fecha_inicio, creado_por)
VALUES (1, 'Rutina PPL (Push Pull Legs)', 'Rutina de 6 días enfocada en hipertrofia', 'Hipertrofia', 'Intermedio', 8, CURDATE(), 1);

SET @plan_id = LAST_INSERT_ID();

-- DÍA 1: PULL (Espalda y Bíceps)
INSERT INTO dias_entrenamiento (plan_id, numero_dia, nombre, descripcion, notas)
VALUES (@plan_id, 1, 'Pull - Espalda y Bíceps', 'Trabajo de espalda y brazos', 'Calienta bien antes de las dominadas');

SET @dia1_id = LAST_INSERT_ID();

INSERT INTO ejercicios_dia (dia_id, nombre_ejercicio, series, repeticiones, peso, descanso, notas, orden) VALUES
(@dia1_id, 'Dominadas', 4, '10', 'Peso corporal', '90 seg', 'Si no logras las 10, haz las que puedas. Si son muy fáciles, puedes agregar peso.', 1),
(@dia1_id, 'Halones cerrados', 4, '15', 'Progresivo', '60 seg', 'Controla el movimiento en la bajada', 2),
(@dia1_id, 'Pullover', 3, '15', '15-20kg', '60 seg', 'Mantén los codos ligeramente flexionados', 3),
(@dia1_id, 'Remo con mancuerna', 3, '12', 'Progresivo', '60 seg', '3 series de 12 repeticiones por brazo', 4),
(@dia1_id, 'Curl de bíceps con mancuerna', 3, '15', '10-15kg', '45 seg', 'Evita balancear el cuerpo', 5),
(@dia1_id, 'Predicador', 3, '15', 'Moderado', '45 seg', 'Full contracción en cada rep', 6);

-- DÍA 2: PUSH (Pecho, hombros y tríceps)
INSERT INTO dias_entrenamiento (plan_id, numero_dia, nombre, descripcion, notas)
VALUES (@plan_id, 2, 'Push - Pecho y Hombros', 'Trabajo de empuje', 'Mantén el core activado en todos los ejercicios');

SET @dia2_id = LAST_INSERT_ID();

INSERT INTO ejercicios_dia (dia_id, nombre_ejercicio, series, repeticiones, peso, descanso, notas, orden) VALUES
(@dia2_id, 'Press banca plano', 4, '8-10', 'Progresivo', '90 seg', 'Baja la barra hasta el pecho controladamente', 1),
(@dia2_id, 'Press inclinado con mancuernas', 4, '10-12', 'Progresivo', '75 seg', 'Inclinación de 30-45 grados', 2),
(@dia2_id, 'Aperturas con mancuernas', 3, '12-15', 'Moderado', '60 seg', 'Estira bien el pecho sin bloquear codos', 3),
(@dia2_id, 'Press militar', 4, '10', 'Progresivo', '75 seg', 'Mantén el abdomen contraído', 4),
(@dia2_id, 'Elevaciones laterales', 3, '15', 'Ligero', '45 seg', 'Control en la bajada, sin balanceo', 5),
(@dia2_id, 'Fondos en paralelas', 3, '12-15', 'Peso corporal', '60 seg', 'Si es muy fácil, agrega peso', 6);

-- DÍA 3: LEGS (Piernas)
INSERT INTO dias_entrenamiento (plan_id, numero_dia, nombre, descripcion, notas)
VALUES (@plan_id, 3, 'Legs - Pierna Completa', 'Trabajo de tren inferior', 'Este es el día más exigente, asegúrate de descansar bien');

SET @dia3_id = LAST_INSERT_ID();

INSERT INTO ejercicios_dia (dia_id, nombre_ejercicio, series, repeticiones, peso, descanso, notas, orden) VALUES
(@dia3_id, 'Sentadilla con barra', 4, '8-10', 'Progresivo', '120 seg', 'Profundidad paralela o más. Espalda recta.', 1),
(@dia3_id, 'Prensa de pierna', 4, '12-15', 'Pesado', '90 seg', 'Baja hasta 90 grados', 2),
(@dia3_id, 'Peso muerto rumano', 3, '10-12', 'Progresivo', '90 seg', 'Siente el estiramiento en los isquios', 3),
(@dia3_id, 'Curl femoral acostado', 3, '12-15', 'Moderado', '60 seg', 'Contracción máxima arriba', 4),
(@dia3_id, 'Extensión de cuádriceps', 3, '15', 'Moderado', '60 seg', 'Pausa de 1 seg en la contracción', 5),
(@dia3_id, 'Elevación de pantorrillas', 4, '20', 'Pesado', '45 seg', 'Rango completo de movimiento', 6);

-- ========================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ========================================

CREATE INDEX idx_registros_fecha ON registros_entrenamiento(fecha);
CREATE INDEX idx_ejercicios_nombre ON ejercicios_dia(nombre_ejercicio);

SELECT 'Nuevo modelo de planes de entrenamiento creado exitosamente!' as resultado;
SELECT CONCAT('Plan de ejemplo creado con ID: ', @plan_id) as info;
