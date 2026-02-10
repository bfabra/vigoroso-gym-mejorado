-- Script de diagnóstico para planes de entrenamiento
-- Ejecutar en MySQL para ver qué hay en la base de datos

-- 1. Ver todos los planes guardados
SELECT
    pe.id,
    pe.participante_id,
    pe.mes_año,
    pe.creado_por,
    pe.fecha_creacion,
    u.nombre as creador_nombre,
    (SELECT COUNT(*) FROM ejercicios_plan WHERE plan_id = pe.id) as total_ejercicios
FROM planes_entrenamiento pe
LEFT JOIN usuarios u ON pe.creado_por = u.id
ORDER BY pe.fecha_creacion DESC
LIMIT 10;

-- 2. Ver ejercicios del último plan guardado
SELECT ep.*
FROM ejercicios_plan ep
JOIN planes_entrenamiento pe ON ep.plan_id = pe.id
WHERE pe.participante_id = 2
ORDER BY pe.fecha_creacion DESC, ep.dia_semana, ep.orden
LIMIT 50;

-- 3. Verificar que el procedimiento almacenado existe
SHOW PROCEDURE STATUS WHERE Name = 'sp_get_plan_entrenamiento';

-- 4. Probar el procedimiento almacenado manualmente
CALL sp_get_plan_entrenamiento(2, '2026-02');

-- 5. Ver el último plan para participante 2
SELECT * FROM planes_entrenamiento
WHERE participante_id = 2
ORDER BY fecha_creacion DESC
LIMIT 1;
