# 📘 Guía de Instalación Paso a Paso - Gimnasio VIGOROSO

Esta guía te llevará desde cero hasta tener el sistema funcionando completamente.

## 📋 Pre-requisitos

### 1. Instalar Node.js
```bash
# Descargar desde https://nodejs.org/ (versión LTS recomendada)
# Verificar instalación:
node --version
npm --version
```

### 2. Instalar MySQL

#### Windows:
1. Descargar MySQL Installer desde https://dev.mysql.com/downloads/installer/
2. Ejecutar instalador y seleccionar "Developer Default"
3. Configurar contraseña root
4. Iniciar MySQL Server

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### macOS:
```bash
brew install mysql
brew services start mysql
```

Verificar instalación:
```bash
mysql --version
```

## 🚀 Instalación del Proyecto

### Paso 1: Descargar el Proyecto
```bash
# Si tienes Git instalado:
git clone <url-del-repositorio>
cd vigoroso-gym-fullstack

# O descomprimir el archivo ZIP en una carpeta
```

### Paso 2: Configurar Base de Datos

#### 2.1. Acceder a MySQL
```bash
mysql -u root -p
# Introducir la contraseña de root que configuraste
```

#### 2.2. Crear usuario para la aplicación (opcional pero recomendado)
```sql
CREATE USER 'vigoroso_user'@'localhost' IDENTIFIED BY 'vigoroso_password_123';
GRANT ALL PRIVILEGES ON vigoroso_gym.* TO 'vigoroso_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 3: Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env (usar nano, vim, o notepad)
# Windows:
notepad .env

# Linux/Mac:
nano .env
```

Configurar `.env` con tus datos:
```env
PORT=3001
NODE_ENV=development

# Si usaste el usuario vigoroso_user:
DB_HOST=localhost
DB_USER=vigoroso_user
DB_PASSWORD=vigoroso_password_123
DB_NAME=vigoroso_gym
DB_PORT=3306

# O si usas root directamente:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD_MYSQL_AQUI
DB_NAME=vigoroso_gym
DB_PORT=3306

JWT_SECRET=mi_clave_secreta_super_segura_123456789
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://localhost:3000
```

### Paso 4: Inicializar Base de Datos

```bash
# Desde la carpeta backend
npm run init-db
```

Deberías ver:
```
✅ Conectado a MySQL
✅ Base de datos 'vigoroso_gym' creada/verificada
✅ Tabla usuarios creada
✅ Tabla participantes creada
...
✅ Usuario administrador creado
   Email: admin@gmail.com
   Password: admin123
```

### Paso 5: Iniciar Backend

```bash
# Modo desarrollo (auto-reload)
npm run dev

# O modo producción
npm start
```

Deberías ver:
```
╔════════════════════════════════════════╗
║     🏋️  GIMNASIO VIGOROSO API 🏋️         ║
╚════════════════════════════════════════╝
🚀 Servidor corriendo en puerto 3001
```

**¡No cierres esta terminal!** El servidor debe estar corriendo.

### Paso 6: Configurar Frontend

Abre una **NUEVA terminal/ventana de comandos**:

```bash
# Desde la raíz del proyecto
cd frontend

# Instalar dependencias
npm install

# Crear archivo de configuración (opcional)
# Crear archivo .env en frontend con:
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env
```

### Paso 7: Iniciar Frontend

```bash
# Desde la carpeta frontend
npm start
```

Se abrirá automáticamente el navegador en http://localhost:3000

## 🔐 Acceso al Sistema

### Credenciales de Administrador:
- **Email:** admin@gmail.com
- **Contraseña:** admin123

### Primer Login:
1. Ir a http://localhost:3000
2. Usar las credenciales de administrador
3. ¡Empezar a usar el sistema!

## ✅ Verificación de Instalación

### 1. Verificar Backend
Abrir en navegador: http://localhost:3001/api/health

Deberías ver:
```json
{
  "status": "OK",
   "message": "API Gimnasio VIGOROSO funcionando correctamente",
  "timestamp": "2024-..."
}
```

### 2. Verificar Frontend
Abrir en navegador: http://localhost:3000

Deberías ver la pantalla de login del Gimnasio VIGOROSO.

### 3. Verificar Base de Datos
```bash
mysql -u root -p
```
```sql
USE vigoroso_gym;
SHOW TABLES;
```

Deberías ver 7 tablas:
- usuarios
- participantes
- planes_entrenamiento
- ejercicios_plan
- registros_entrenamiento
- planes_nutricion
- comidas_plan

## 🔧 Solución de Problemas Comunes

### Error: "Cannot connect to MySQL"
```bash
# Verificar que MySQL está corriendo
# Windows:
services.msc
# Buscar MySQL y verificar que está "En ejecución"

# Linux:
sudo systemctl status mysql

# Mac:
brew services list
```

### Error: "Access denied for user"
- Verificar que la contraseña en `.env` coincide con MySQL
- Verificar que el usuario existe en MySQL

### Error: "Port 3000 already in use"
```bash
# Cambiar puerto del frontend
# En frontend/.env agregar:
PORT=3001
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "CORS policy"
- Verificar que CORS_ORIGIN en backend/.env coincide con la URL del frontend

## 📱 Uso del Sistema

### Como Entrenador:

1. **Login** con admin@gmail.com
2. **Agregar Participante:**
   - Click en "Agregar Participante"
   - Llenar formulario
   - Guardar

3. **Crear Plan de Entrenamiento:**
   - Click en el participante
   - Tab "Plan de Entrenamiento"
   - Click "Editar Plan"
   - Llenar ejercicios para cada día
   - Guardar

4. **Crear Plan de Nutrición:**
   - Click en el participante
   - Tab "Plan de Nutrición"
   - Click "Editar Plan"
   - Llenar opciones de comidas
   - Guardar

### Como Participante:

1. **Login** con el email y contraseña que te dio el entrenador
2. **Ver Entrenamiento:**
   - Seleccionar fecha
   - Expandir día de la semana
   - Registrar pesos utilizados
   - Los datos se guardan automáticamente

3. **Ver Nutrición:**
   - Tab "Mi Nutrición"
   - Ver opciones de cada comida

## 🎯 Próximos Pasos

1. Cambiar la contraseña del administrador
2. Crear entrenadores adicionales si es necesario
3. Empezar a agregar participantes
4. Configurar planes de entrenamiento y nutrición

## 🆘 Soporte

Si tienes problemas:
1. Revisar los logs en las terminales de backend y frontend
2. Verificar que MySQL está corriendo
3. Revisar la configuración del archivo `.env`
4. Contactar al administrador del sistema

## 📚 Recursos Adicionales

- Documentación de API: Ver archivo README.md
- Estructura de Base de Datos: Ver archivo database.sql

---

**¡Listo para entrenar! 🏋️**
