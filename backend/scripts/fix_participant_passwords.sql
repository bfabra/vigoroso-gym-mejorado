-- Script para diagnosticar y corregir contraseñas de participantes

-- 1. Ver el formato actual de la contraseña
SELECT
    id,
    nombre,
    email,
    password,
    CHAR_LENGTH(password) as password_length,
    LEFT(password, 7) as password_prefix,
    activo,
    fecha_registro
FROM participantes
WHERE email = 'fabraidee@gmail.com';

-- 2. Ver todos los participantes y el formato de sus contraseñas
SELECT
    id,
    nombre,
    email,
    CHAR_LENGTH(password) as password_length,
    LEFT(password, 7) as password_prefix,
    CASE
        WHEN LEFT(password, 7) = '$2b$10$' OR LEFT(password, 7) = '$2a$10$' THEN 'Hasheada (bcrypt)'
        WHEN CHAR_LENGTH(password) = 60 THEN 'Probablemente hasheada'
        ELSE 'TEXTO PLANO - INSEGURO'
    END as formato_password,
    activo
FROM participantes
ORDER BY fecha_registro DESC;

-- NOTA: Las contraseñas bcrypt tienen:
-- - Longitud de 60 caracteres
-- - Prefijo $2b$10$ o $2a$10$
--
-- Si ves "TEXTO PLANO", esas contraseñas deben ser reseteadas.
