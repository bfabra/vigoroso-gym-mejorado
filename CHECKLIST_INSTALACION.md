# ✅ Checklist de Instalación - Mejoras Vigoroso Gym

## 📦 Instalación Paso a Paso

### Paso 1: Instalar Dependencias
```bash
cd backend
npm install winston express-rate-limit
```
- [ ] Ejecutado
- [ ] Sin errores

### Paso 2: Configurar Variables de Entorno
```bash
# Genera un JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edita tu archivo `.env`:
- [ ] JWT_SECRET tiene al menos 32 caracteres
- [ ] Todas las variables del .env.example están presentes
- [ ] DB_PASSWORD está configurado correctamente

### Paso 3: Crear Carpeta de Logs
```bash
mkdir -p backend/logs
```
- [ ] Carpeta creada
- [ ] Permisos correctos (escritura)

### Paso 4: Aplicar Índices a la Base de Datos
```bash
mysql -u root -p vigoroso_gym < backend/scripts/addIndexes.sql
```
- [ ] Script ejecutado sin errores
- [ ] Índices creados correctamente

### Paso 5: Verificar Estructura de Archivos
Asegúrate de que existen estos archivos nuevos:
- [ ] `backend/config/env.js`
- [ ] `backend/config/constants.js`
- [ ] `backend/utils/asyncHandler.js`
- [ ] `backend/utils/logger.js`
- [ ] `backend/scripts/addIndexes.sql`
- [ ] `backend/logs/` (carpeta)

### Paso 6: Actualizar Código Existente
Los siguientes archivos deben estar actualizados:
- [ ] `backend/server.js`
- [ ] `backend/controllers/authController.js`
- [ ] `backend/controllers/participantesController.js`
- [ ] `backend/routes/auth.js`
- [ ] `backend/routes/participantes.js`
- [ ] `backend/package.json`

### Paso 7: Prueba Inicial
```bash
npm run dev
```

Deberías ver:
- [ ] ✅ Variables de entorno validadas correctamente
- [ ] ✅ Conexión exitosa a MySQL
- [ ] 🚀 Servidor corriendo en puerto 3001
- [ ] Sin errores en consola

### Paso 8: Pruebas de Funcionalidad

#### Test A: Validación de Email
```bash
curl -X POST http://localhost:3001/api/auth/login/usuario \
  -H "Content-Type: application/json" \
  -d '{"email":"not-email","password":"12345678"}'
```
Resultado esperado:
- [ ] Status: 400
- [ ] Mensaje: "Error de validación"

#### Test B: Rate Limiting (ejecutar 6 veces)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login/usuario \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```
Resultado esperado:
- [ ] Primeras 5 peticiones: 401 (credenciales inválidas)
- [ ] 6ta petición: 429 (Too Many Requests)

#### Test C: Paginación
```bash
curl http://localhost:3001/api/participantes?page=1&limit=5 \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```
Resultado esperado:
- [ ] Tiene campo `data`
- [ ] Tiene campo `pagination` con: page, limit, total, totalPages

#### Test D: Logs
- [ ] Archivo `backend/logs/combined.log` se crea
- [ ] Archivo `backend/logs/error.log` existe (puede estar vacío)
- [ ] Los logs contienen timestamps y niveles

### Paso 9: Verificar Frontend (si aplica)
- [ ] Frontend puede hacer login
- [ ] Frontend puede listar participantes
- [ ] No hay errores de CORS

### Paso 10: Limpieza Final
- [ ] Código commit a git
- [ ] Archivo `.env` NO está en git (.gitignore)
- [ ] Documentación actualizada

---

## ⚠️ Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Cannot find module 'winston'" | `npm install` |
| "JWT_SECRET too short" | Genera uno nuevo con el comando del Paso 2 |
| "EACCES: permission denied, mkdir 'logs'" | `mkdir -p backend/logs` |
| Rate limiting no funciona | Verifica que `express-rate-limit` está instalado |
| Validación no funciona | Verifica que los cambios en `routes/` están aplicados |

---

## 🎯 Estado de la Instalación

- [ ] ✅ **Todas las dependencias instaladas**
- [ ] ✅ **Variables de entorno configuradas**
- [ ] ✅ **Base de datos con índices**
- [ ] ✅ **Servidor arranca sin errores**
- [ ] ✅ **Tests básicos pasando**
- [ ] ✅ **Logs funcionando**

**Fecha de instalación:** _________________

**Instalado por:** _________________

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa `backend/logs/error.log`
2. Verifica que todas las casillas estén marcadas
3. Compara tu código con el código actualizado
4. Consulta `MEJORAS_IMPLEMENTADAS.md` para más detalles

¡Éxito! 🚀
