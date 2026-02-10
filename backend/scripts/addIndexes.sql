-- Script para agregar índices a la base de datos
-- Esto mejora significativamente el performance de las consultas

-- Índices para tabla participantes
CREATE INDEX IF NOT EXISTS idx_participantes_email ON participantes(email);
CREATE INDEX IF NOT EXISTS idx_participantes_activo ON participantes(activo);
CREATE INDEX IF NOT EXISTS idx_participantes_fecha_registro ON participantes(fecha_registro);

-- Índices para tabla usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Índices para tabla planes_entrenamiento
CREATE INDEX IF NOT EXISTS idx_planes_entrenamiento_participante ON planes_entrenamiento(participante_id);
CREATE INDEX IF NOT EXISTS idx_planes_entrenamiento_mes ON planes_entrenamiento(mes_año);
CREATE INDEX IF NOT EXISTS idx_planes_entrenamiento_activo ON planes_entrenamiento(activo);

-- Índices para tabla planes_nutricion
CREATE INDEX IF NOT EXISTS idx_planes_nutricion_participante ON planes_nutricion(participante_id);
CREATE INDEX IF NOT EXISTS idx_planes_nutricion_activo ON planes_nutricion(activo);

-- Índices para tabla registros_entrenamiento (si existe)
-- Descomenta si tienes esta tabla
-- CREATE INDEX IF NOT EXISTS idx_registros_entrenamiento_participante ON registros_entrenamiento(participante_id);
-- CREATE INDEX IF NOT EXISTS idx_registros_entrenamiento_fecha ON registros_entrenamiento(fecha);

SELECT 'Índices creados exitosamente!' as resultado;
