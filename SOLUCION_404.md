# 🔧 Solución al Error 404 en Planes de Entrenamiento

## 🎯 Problema Identificado

El plan se **guarda correctamente** pero **no se puede cargar** (retorna 404).

### Causa Raíz

El procedimiento almacenado `sp_get_plan_entrenamiento` probablemente:
- No está instalado en la base de datos
- Está desactualizado
- Tiene un error de sintaxis

---

## ✅ Solución (5 minutos)

### Paso 1: Verificar el procedimiento almacenado

Abre tu cliente MySQL (MySQL Workbench, HeidiSQL, o línea de comandos) y ejecuta:

```sql
-- Ver si el procedimiento existe
SHOW PROCEDURE STATUS WHERE Name = 'sp_get_plan_entrenamiento';
```

**Si retorna 0 filas** → El procedimiento NO está instalado.

---

### Paso 2: Reinstalar los procedimientos almacenados

Ejecuta el siguiente script en MySQL:

```bash
# Desde la carpeta raíz del proyecto:
cd vigoroso-gym-mejorado

# Opción 1: Desde línea de comandos MySQL
mysql -u root -p gimnasio_db < backend/scripts/entrenamiento_plan_procedures.sql

# Opción 2: Copiar y pegar en MySQL Workbench
# Abre backend/scripts/entrenamiento_plan_procedures.sql
# Copia todo el contenido
# Pégalo en MySQL Workbench
# Ejecuta (Ctrl+Shift+Enter)
```

---

### Paso 3: Verificar que se instaló correctamente

```sql
-- Debe retornar 1 fila con información del procedimiento
SHOW PROCEDURE STATUS WHERE Name = 'sp_get_plan_entrenamiento';

-- Probar el procedimiento manualmente
CALL sp_get_plan_entrenamiento(2, '2026-02');
```

**Resultado esperado:**
- Si hay plan: Retorna 1 fila con los datos del plan
- Si NO hay plan: Retorna 0 filas (conjunto vacío) ← **Esto es correcto**

---

### Paso 4: Reiniciar el backend

```bash
# Detener el backend (Ctrl+C en la terminal donde está corriendo)

# Reiniciar
cd vigoroso-gym-mejorado/backend
npm start
```

---

### Paso 5: Probar en el frontend

1. Refresca el navegador (F5)
2. Selecciona un participante
3. Crea un plan de entrenamiento
4. Aplica una plantilla
5. Guarda el plan
6. **Ahora debería cargar correctamente** ✅

---

## 🔍 Diagnóstico Adicional

Si el problema persiste, ejecuta este script de diagnóstico:

```sql
-- Ver todos los planes guardados
SELECT
    pe.id,
    pe.participante_id,
    pe.mes_año,
    pe.creado_por,
    pe.fecha_creacion,
    (SELECT COUNT(*) FROM ejercicios_plan WHERE plan_id = pe.id) as total_ejercicios
FROM planes_entrenamiento pe
ORDER BY pe.fecha_creacion DESC
LIMIT 10;

-- Ver ejercicios del último plan del participante 2
SELECT ep.*
FROM ejercicios_plan ep
JOIN planes_entrenamiento pe ON ep.plan_id = pe.id
WHERE pe.participante_id = 2
  AND pe.mes_año = '2026-02'
ORDER BY ep.dia_semana, ep.orden;
```

**Lo que deberías ver:**
- Una fila en `planes_entrenamiento` con `mes_año = '2026-02'`
- 6 filas en `ejercicios_plan` (los ejercicios que guardaste)

---

## 🚨 Si AÚN no funciona

### Problema: El backend usa una versión antigua

Verifica que tu archivo `backend/controllers/entrenamientoController.js` tenga este código en las líneas 11-13:

```javascript
if (planes.length === 0) {
  return res.json({ plan: null, ejercicios: [] }); // ← Debe retornar 200 OK
}
```

**NO debe tener:**
```javascript
if (planes.length === 0) {
  return res.status(404).json({ error: 'Plan no encontrado' }); // ← INCORRECTO
}
```

---

### Problema: Múltiples instancias del backend

Verifica que solo haya **UNA instancia** del backend corriendo:

```bash
# Windows PowerShell
Get-Process -Name node

# Si ves múltiples procesos, matar todos:
taskkill /F /IM node.exe

# Luego reinicia el backend
cd vigoroso-gym-mejorado/backend
npm start
```

---

## 📊 Logs que Deberías Ver

**Después de la solución:**

```
=== INICIANDO GUARDADO ===
⚠️ MES QUE SE GUARDARÁ: 2026-02
Ejercicios con datos: 6
✅ RESPUESTA DEL SERVIDOR: { message: "...", plan_id: 123 }

🔵 loadPlan INICIANDO
📡 Llamando a entrenamientoService.obtenerPlan...
📦 Datos recibidos del servidor: {
  "plan": { "id": 123, "mes_año": "2026-02", ... },
  "ejercicios": [ {...}, {...}, ... ]  ← 6 ejercicios
}
✅ Usando ejercicios existentes: 6  ← ¡YA NO DICE "vacío"!
```

---

## 💡 Resumen

El problema es que el **procedimiento almacenado no está instalado**. La solución es:

1. ✅ Instalar `backend/scripts/entrenamiento_plan_procedures.sql`
2. ✅ Reiniciar el backend
3. ✅ Refrescar el navegador
4. ✅ Probar de nuevo

**Tiempo total:** 5 minutos

---

¿Necesitas ayuda con algún paso? ¡Avísame! 🚀
