# 🏋️ Sistema de Gestión Gimnasio VIGOROSO

Sistema completo de gestión de entrenamiento y nutrición para gimnasios, con interfaz web moderna y API REST con MySQL.

## 📋 Características

### Para Entrenadores:
- ✅ Gestión completa de participantes
- ✅ Creación de planes de entrenamiento mensuales (6 ejercicios × 6 días)
- ✅ Diseño de planes de nutrición personalizados (5 comidas con 2 opciones)
- ✅ Seguimiento del progreso de los participantes
- ✅ Dashboard con estadísticas

### Para Participantes:
- ✅ Visualización de plan de entrenamiento personalizado
- ✅ Registro diario de pesos utilizados en ejercicios
- ✅ Acceso al plan de nutrición
- ✅ Historial completo de entrenamientos
- ✅ Seguimiento de progreso personal

## 🛠️ Tecnologías

### Backend:
- Node.js + Express
- MySQL
- JWT para autenticación
- bcrypt para encriptación
- Helmet para seguridad
- CORS configurado

### Frontend:
- React 18
- Tailwind CSS
- Lucide React Icons
- Almacenamiento persistente
- Diseño responsive

## 📦 Instalación

### 1. Requisitos Previos
```bash
# Instalar Node.js (v14+)
# Instalar MySQL (v8+)
```

### 2. Configurar Base de Datos

```bash
# Acceder a MySQL
mysql -u root -p

# Crear base de datos (opcional, el script lo hace automáticamente)
CREATE DATABASE vigoroso_gym;
```

### 3. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de MySQL
nano .env
```

Configurar `.env`:
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=vigoroso_gym
DB_PORT=3306
JWT_SECRET=clave_secreta_super_segura_cambiar_en_produccion
CORS_ORIGIN=http://localhost:3000
```
```
# Inicializar base de datos (crear tablas y usuario admin)
npm run init-db

# Iniciar servidor de desarrollo
npm run dev

# O iniciar servidor de producción
npm start
```

### 4. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar aplicación
npm start
```

## 🔐 Credenciales por Defecto

### Usuario Administrador:
- **Email:** admin@gmail.com
- **Contraseña:** admin123

> ⚠️ **IMPORTANTE:** Cambiar estas credenciales en producción

## 📁 Estructura del Proyecto

```
vigoroso-gym-fullstack/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración MySQL
│   ├── controllers/
│   │   ├── authController.js    # Autenticación
│   │   ├── participantesController.js
│   │   ├── entrenamientoController.js
│   │   └── nutricionController.js
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── participantes.js
│   │   ├── entrenamiento.js
│   │   └── nutricion.js
│   ├── scripts/
│   │   └── initDatabase.js      # Inicialización DB
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Servidor principal
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── database.sql                 # Schema completo SQL
```

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/login/usuario       - Login entrenador/admin
POST   /api/auth/login/participante  - Login participante
GET    /api/auth/verificar           - Verificar token
POST   /api/auth/registrar-usuario   - Registrar usuario (admin only)
```

### Participantes
```
GET    /api/participantes            - Listar todos
GET    /api/participantes/:id        - Obtener uno
POST   /api/participantes            - Crear participante
PUT    /api/participantes/:id        - Actualizar
DELETE /api/participantes/:id        - Eliminar (soft delete)
PATCH  /api/participantes/:id/cambiar-password
```

### Entrenamiento
```
GET    /api/entrenamiento/plan/:participante_id/:mes_año
POST   /api/entrenamiento/plan       - Guardar plan
GET    /api/entrenamiento/planes/:participante_id
POST   /api/entrenamiento/registro   - Registrar sesión
GET    /api/entrenamiento/registros  - Obtener registros
PUT    /api/entrenamiento/registro/:id
DELETE /api/entrenamiento/registro/:id
```

### Nutrición
```
GET    /api/nutricion/plan/:participante_id
POST   /api/nutricion/plan           - Guardar plan
PUT    /api/nutricion/plan/:id       - Actualizar
GET    /api/nutricion/historial/:participante_id
DELETE /api/nutricion/plan/:id
```

## 🔒 Autenticación

El sistema usa JWT (JSON Web Tokens). Incluir el token en las peticiones:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 💾 Base de Datos

### Tablas Principales:
- `usuarios` - Entrenadores y admins
- `participantes` - Clientes del gimnasio
- `planes_entrenamiento` - Header de planes mensuales
- `ejercicios_plan` - Detalle de ejercicios (6 por día)
- `registros_entrenamiento` - Logs diarios de peso
- `planes_nutricion` - Planes nutricionales
- `comidas_plan` - Detalle de comidas (5 comidas × 2 opciones)

## 🚀 Despliegue en Producción

### Backend:
1. Configurar variables de entorno de producción
2. Usar PM2 o similar para gestión de procesos
3. Configurar HTTPS con certificado SSL
4. Configurar firewall y seguridad

### Frontend:
1. Build de producción: `npm run build`
2. Servir con Nginx o Apache
3. Configurar HTTPS

### Base de Datos:
1. Backup regular automatizado
2. Configurar usuarios con permisos mínimos
3. Habilitar SSL para conexiones

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📝 Licencia

Este proyecto es privado y confidencial.

## 👥 Soporte

Para soporte técnico, contactar al administrador del sistema.

## 🔄 Actualizaciones

### v1.0.0 (2024)
- ✅ Sistema completo de gestión
- ✅ Autenticación JWT
- ✅ Planes de entrenamiento
- ✅ Planes de nutrición
- ✅ Registro de progreso
- ✅ Dashboard responsive

---

**Desarrollado para Gimnasio VIGOROSO** 🏋️
