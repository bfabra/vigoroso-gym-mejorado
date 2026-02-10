# 📡 Documentación API - Gimnasio VIGOROSO

Base URL: `http://localhost:3001/api`

## 🔐 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer {token}
```

---

## 🔑 AUTH - Autenticación

### Login Usuario (Entrenador/Admin)
```http
POST /api/auth/login/usuario
```

**Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
    "id": 1,
    "nombre": "Administrador VIGOROSO",
    "email": "admin@gmail.com",
    "rol": "admin"
  }
}
```

### Login Participante
```http
POST /api/auth/login/participante
```

**Body:**
```json
{
  "email": "carlos@example.com",
  "password": "carlos123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "participante": {
    "id": 1,
    "nombre": "Carlos Rodríguez",
    "email": "carlos@example.com"
  }
}
```

### Verificar Token
```http
GET /api/auth/verificar
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "admin@gmail.com",
    "rol": "admin",
    "tipo": "usuario"
  }
}
```

### Registrar Usuario (Solo Admin)
```http
POST /api/auth/registrar-usuario
Headers: Authorization: Bearer {token_admin}
```

**Body:**
```json
{
  "nombre": "Nuevo Entrenador",
  "email": "nuevo@fabra.com",
  "password": "password123",
  "rol": "entrenador"
}
```

---

## 👥 PARTICIPANTES

### Listar Todos los Participantes
```http
GET /api/participantes
Headers: Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Carlos Rodríguez",
    "email": "carlos@example.com",
    "telefono": "3001234567",
    "fecha_nacimiento": "1995-05-15",
    "genero": "M",
    "fecha_registro": "2024-01-15T10:30:00.000Z",
    "activo": true,
    "usuario_creador_id": 1,
    "total_planes_entrenamiento": 2,
    "total_planes_nutricion": 1
  }
]
```

### Obtener un Participante
```http
GET /api/participantes/:id
Headers: Authorization: Bearer {token}
```

### Crear Participante (Solo Entrenadores)
```http
POST /api/participantes
Headers: Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "juan123",
  "telefono": "3004567890",
  "fecha_nacimiento": "1990-03-20",
  "genero": "M"
}
```

**Response:**
```json
{
  "message": "Participante creado exitosamente",
  "id": 5
}
```

### Actualizar Participante
```http
PUT /api/participantes/:id
Headers: Authorization: Bearer {token}
```

**Body:**
```json
{
  "nombre": "Juan Pérez Actualizado",
  "email": "juan@example.com",
  "telefono": "3009999999",
  "fecha_nacimiento": "1990-03-20",
  "genero": "M"
}
```

### Eliminar Participante (Soft Delete)
```http
DELETE /api/participantes/:id
Headers: Authorization: Bearer {token}
```

### Cambiar Contraseña
```http
PATCH /api/participantes/:id/cambiar-password
Headers: Authorization: Bearer {token}
```

**Body:**
```json
{
  "nueva_password": "nueva_password_segura_123"
}
```

---

## 🏋️ ENTRENAMIENTO

### Obtener Plan de Entrenamiento
```http
GET /api/entrenamiento/plan/:participante_id/:mes_año
Headers: Authorization: Bearer {token}

Ejemplo: /api/entrenamiento/plan/1/2024-02
```

**Response:**
```json
{
  "plan": {
    "id": 1,
    "participante_id": 1,
    "mes_año": "2024-02",
    "fecha_creacion": "2024-02-01T10:00:00.000Z",
    "creado_por": 1,
    "notas": null
  },
  "ejercicios": [
    {
      "id": 1,
      "plan_id": 1,
      "dia_semana": "Lunes",
      "orden": 1,
      "nombre_ejercicio": "Press de Banca",
      "series": "4",
      "repeticiones": "8-10",
      "notas": "Técnica perfecta"
    }
  ]
}
```

### Guardar Plan de Entrenamiento (Solo Entrenadores)
```http
POST /api/entrenamiento/plan
Headers: Authorization: Bearer {token}
```

**Body:**
```json
{
  "participante_id": 1,
  "mes_año": "2024-02",
  "ejercicios": [
    {
      "dia_semana": "Lunes",
      "orden": 1,
      "nombre_ejercicio": "Press de Banca",
      "series": "4",
      "repeticiones": "8-10",
      "notas": "Técnica perfecta"
    },
    {
      "dia_semana": "Lunes",
      "orden": 2,
      "nombre_ejercicio": "Press Inclinado",
      "series": "3",
      "repeticiones": "10-12",
      "notas": ""
    }
  ]
}
```

### Listar Planes de un Participante
```http
GET /api/entrenamiento/planes/:participante_id
Headers: Authorization: Bearer {token}
```

### Eliminar Plan
```http
DELETE /api/entrenamiento/plan/:id
Headers: Authorization: Bearer {token}
```

### Registrar Entrenamiento (Log)
```http
POST /api/entrenamiento/registro
Headers: Authorization: Bearer {token}
```

**Body:**
```json
{
  "participante_id": 1,
  "ejercicio_plan_id": 15,
  "fecha_registro": "2024-02-15",
  "peso_utilizado": 60.5,
  "series_completadas": 4,
  "repeticiones_completadas": 10,
  "comentarios": "Buen entrenamiento, aumentar peso próxima vez"
}
```

### Obtener Registros de Entrenamiento
```http
GET /api/entrenamiento/registros?participante_id=1&fecha_inicio=2024-02-01&fecha_fin=2024-02-28
Headers: Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "participante_id": 1,
    "ejercicio_plan_id": 15,
    "fecha_registro": "2024-02-15",
    "peso_utilizado": 60.50,
    "series_completadas": 4,
    "repeticiones_completadas": 10,
    "comentarios": "Buen entrenamiento",
    "fecha_hora_registro": "2024-02-15T14:30:00.000Z",
    "nombre_ejercicio": "Press de Banca",
    "dia_semana": "Lunes",
    "series_plan": "4",
    "repeticiones_plan": "8-10"
  }
]
```

### Actualizar Registro
```http
PUT /api/entrenamiento/registro/:id
Headers: Authorization: Bearer {token}
```

### Eliminar Registro
```http
DELETE /api/entrenamiento/registro/:id
Headers: Authorization: Bearer {token}
```

---

## 🍎 NUTRICIÓN

### Obtener Plan de Nutrición
```http
GET /api/nutricion/plan/:participante_id
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "plan": {
    "id": 1,
    "participante_id": 1,
    "fecha_creacion": "2024-02-01T10:00:00.000Z",
    "creado_por": 1,
    "recomendaciones_generales": "Beber 3 litros de agua al día...",
    "activo": true
  },
  "comidas": [
    {
      "id": 1,
      "plan_nutricion_id": 1,
      "tipo_comida": "Desayuno",
      "opcion_1": "4 huevos revueltos, 1 taza avena...",
      "opcion_2": "Batido proteico (30g proteína)..."
    }
  ]
}
```

### Guardar Plan de Nutrición (Solo Entrenadores)
```http
POST /api/nutricion/plan
Headers: Authorization: Bearer {token}
```

**Body:**
```json
{
  "participante_id": 1,
  "recomendaciones_generales": "Beber mínimo 3 litros de agua. Suplementar con proteína whey.",
  "comidas": [
    {
      "tipo_comida": "Desayuno",
      "opcion_1": "4 huevos revueltos, 1 taza de avena, 1 plátano",
      "opcion_2": "Batido proteico con avena y mantequilla de maní"
    },
    {
      "tipo_comida": "Media Mañana",
      "opcion_1": "200g pechuga de pollo, 1 taza arroz integral",
      "opcion_2": "Atún con pan integral y aguacate"
    },
    {
      "tipo_comida": "Almuerzo",
      "opcion_1": "250g carne magra, 2 tazas arroz, ensalada",
      "opcion_2": "250g salmón, batata, brócoli"
    },
    {
      "tipo_comida": "Merienda",
      "opcion_1": "Batido post-entreno con 40g proteína",
      "opcion_2": "Yogurt griego con granola y frutas"
    },
    {
      "tipo_comida": "Cena",
      "opcion_1": "200g pechuga de pollo, quinoa, vegetales",
      "opcion_2": "200g pescado blanco, ensalada, papa pequeña"
    }
  ]
}
```

### Actualizar Plan de Nutrición
```http
PUT /api/nutricion/plan/:id
Headers: Authorization: Bearer {token}
```

### Historial de Planes
```http
GET /api/nutricion/historial/:participante_id
Headers: Authorization: Bearer {token}
```

### Eliminar Plan
```http
DELETE /api/nutricion/plan/:id
Headers: Authorization: Bearer {token}
```

---

## ❌ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token no proporcionado o inválido |
| 403 | Forbidden - Sin permisos para esta acción |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

## 📝 Ejemplos de Errores

```json
{
  "error": "Credenciales inválidas"
}
```

```json
{
  "error": "Acceso denegado. Token no proporcionado."
}
```

```json
{
  "error": "Participante no encontrado"
}
```

---

## 🧪 Testing con cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login/usuario \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'
```

### Crear Participante
```bash
curl -X POST http://localhost:3001/api/participantes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "telefono": "3001234567",
    "genero": "M"
  }'
```

### Obtener Participantes
```bash
curl -X GET http://localhost:3001/api/participantes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Roles y Permisos

### Admin
- ✅ Crear usuarios (entrenadores)
- ✅ Todas las acciones de entrenador

### Entrenador
- ✅ CRUD Participantes
- ✅ CRUD Planes de entrenamiento
- ✅ CRUD Planes de nutrición
- ✅ Ver registros de todos los participantes

### Participante
- ✅ Ver su propio plan de entrenamiento
- ✅ Registrar sus entrenamientos
- ✅ Ver su plan de nutrición
- ✅ Ver su progreso
- ❌ No puede ver/modificar otros participantes

---

**Última actualización:** 2024
**Versión:** 1.0.0
