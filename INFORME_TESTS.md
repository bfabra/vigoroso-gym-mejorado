# Informe de Análisis de Tests - Proyecto Vigoroso Gym

**Fecha de análisis:** 2026-02-19
**Proyecto:** vigoroso-gym-mejorado
**Agente:** Tests Analyzer
**Stack:** Node.js + Express + React + MySQL

---

## 1. ESTADO ACTUAL DE LOS TESTS

### Cobertura de Tests
- **Líneas de código:** ~6,570 líneas
- **Cobertura actual:** 0% (sin tests propios)
- **Estado:** CRÍTICO - No hay tests implementados en el proyecto

### Búsqueda de Archivos de Test Realizada
Se realizó búsqueda exhaustiva en:
- Patrones: `*.test.js`, `*.spec.js`
- Directorios: `__tests__/`, `test/`, `tests/`
- Resultado: Solo encontrados tests en dependencias de npm (bcrypt, @sinonjs, etc.)

---

## 2. ANÁLISIS DE DEPENDENCIAS DE TESTING

### Backend (package.json)
**Dependencias instaladas:** NO EXISTE LIBRERÍA DE TESTING
```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^2.0.2",
    "mysql2": "^3.6.5",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

**Recomendación:** Agregar Jest, Supertest, o Mocha + Chai

### Frontend (package.json)
**Testing disponible:** SÍ (vía react-scripts)
```json
{
  "scripts": {
    "test": "react-scripts test"  // ← Jest configurado implícitamente
  }
}
```
**ESLint Config:** Incluye `react-app/jest`
**Estado:** Jest está disponible pero NO se están usando tests

---

## 3. MÓDULOS SIN TESTS CRÍTICOS

### Backend - Controllers (7 módulos)
1. **authController.js**
   - `loginUsuario()` - Autenticación de entrenadores/admins
   - `loginParticipante()` - Autenticación de participantes
   - `registrarUsuario()` - Registro de nuevos usuarios
   - `verificarToken()` - Validación de tokens JWT

2. **participantesController.js**
   - `obtenerParticipantes()` - Listado con paginación
   - `obtenerParticipante()` - Obtener por ID
   - `crearParticipante()` - Crear nuevo participante
   - `actualizarParticipante()` - Actualizar datos
   - `eliminarParticipante()` - Eliminar participante
   - `cambiarPassword()` - Cambio de contraseña

3. **entrenamientoController.js**
   - Gestión de planes de entrenamiento
   - Registro de entrenamientos completados
   - Historial de ejercicios
   - Upload de imágenes

4. **nutricionController.js**
   - Planes nutricionales por participante
   - Historial de planes
   - Actualización de información

5. **catalogoController.js**
   - CRUD de catálogo de ejercicios
   - Gestión de imágenes
   - Búsqueda y filtrado

6. **plantillasController.js**
   - CRUD de plantillas de entrenamiento
   - Duplicación de plantillas
   - Asignación a participantes

7. **asignacionesController.js**
   - Asignación de planes a participantes
   - Historial de asignaciones
   - Registro de entrenamientos en v2

### Backend - Middleware (2 módulos)
1. **auth.js**
   - `authenticateToken()` - Validación JWT
   - `isTrainer()` - Verificación de rol entrenador
   - `isAdmin()` - Verificación de rol admin

2. **upload.js**
   - Configuración de Multer para uploads

### Backend - Routes (8 módulos)
- `auth.js` - Rutas de autenticación
- `usuarios.js` - Rutas de usuarios (trainers/admins)
- `participantes.js` - Rutas de participantes
- `entrenamiento.js` - Rutas de planes y registros
- `nutricion.js` - Rutas de planes nutricionales
- `catalogo.js` - Rutas del catálogo
- `plantillas.js` - Rutas de plantillas
- `asignaciones.js` - Rutas de asignaciones

### Frontend - Componentes Críticos (11 componentes)
1. **services/api.js** (432 líneas)
   - Interceptores de axios
   - Manejo de tokens
   - Llamadas a 8 servicios principales
   - Gestión de errores 401

2. **components/auth/LoginView.jsx**
   - Gestión de estado (email, password, isParticipant)
   - Formulario con validación
   - Manejo de errores

3. **components/participant/ParticipantDashboard.jsx**
   - Vista principal de participante
   - Integración con múltiples servicios

4. **components/trainer/TrainerDashboard.jsx**
   - Panel principal del entrenador
   - Gestión de participantes

5. **components/trainer/ManageParticipant.jsx**
   - Crear/editar participantes
   - Cambio de credenciales

6. **components/trainer/ExerciseCatalogManager.jsx**
   - CRUD del catálogo de ejercicios
   - Upload de imágenes

7. **components/trainer/TemplateCatalogManager.jsx**
   - CRUD de plantillas

8. **components/training/TrainingPlanManager.jsx**
   - Gestión de planes de entrenamiento
   - Asignación de ejercicios

9. **components/training/TemplateAssigner.jsx**
   - Asignación de plantillas a participantes

10. **components/nutrition/NutritionPlanManager.jsx**
    - Gestión de planes nutricionales

11. **App.js**
    - Enrutamiento y gestión de autenticación

---

## 4. CASOS DE PRUEBA CRÍTICOS POR DOMINIO

### AUTENTICACIÓN Y SEGURIDAD (CRÍTICO)
**Casos de prueba para authController.js:**
- ✓ Login exitoso con credenciales válidas (usuario y participante)
- ✓ Login fallido con email inexistente
- ✓ Login fallido con contraseña incorrecta
- ✓ Login fallido sin email/contraseña
- ✓ Validación de email formato
- ✓ Generación correcta de JWT token
- ✓ Token JWT contiene datos correctos (id, email, rol)
- ✓ Expiración de token configurable
- ✓ Registro de usuario solo por admin
- ✓ Verificación de token válido/expirado/inválido
- ✓ Rate limiting en endpoint /login
- ✓ Hashing seguro de contraseñas con bcrypt

**Casos para middleware/auth.js:**
- ✓ Token ausente retorna 401
- ✓ Token malformado retorna 403
- ✓ Token expirado retorna 403
- ✓ Solo trainers pueden acceder a rutas entrenador
- ✓ Solo admins pueden acceder a rutas admin
- ✓ Participante no puede acceder a rutas admin

### GESTIÓN DE PARTICIPANTES (ALTO VALOR)
**Casos para participantesController.js:**
- ✓ Crear participante con datos válidos
- ✓ Crear participante sin campos requeridos
- ✓ Obtener listado con paginación (límite, offset)
- ✓ Obtener participante por ID existente
- ✓ Obtener participante por ID inexistente (404)
- ✓ Actualizar datos de participante
- ✓ Cambiar contraseña de participante
- ✓ Eliminar participante
- ✓ Buscar/filtrar participantes
- ✓ Validación de email único
- ✓ Activación/desactivación de participante

### PLANES DE ENTRENAMIENTO (ALTO VALOR)
**Casos para entrenamientoController.js:**
- ✓ Crear plan de entrenamiento para participante
- ✓ Obtener plan por mes/año
- ✓ Guardar registro de entrenamiento completado
- ✓ Actualizar registro de entrenamiento
- ✓ Obtener historial de un ejercicio
- ✓ Obtener último registro de un ejercicio
- ✓ Registrar series, repeticiones y peso
- ✓ Eliminar plan de entrenamiento
- ✓ Upload de imagen de ejercicio
- ✓ Eliminar imagen de ejercicio
- ✓ Validación de datos de entrenamiento

### CATÁLOGO DE EJERCICIOS (VALOR MEDIO)
**Casos para catalogoController.js:**
- ✓ Listar ejercicios con paginación
- ✓ Crear ejercicio con datos válidos
- ✓ Actualizar datos de ejercicio
- ✓ Eliminar ejercicio
- ✓ Buscar ejercicio por ID
- ✓ Búsqueda/filtrado de ejercicios
- ✓ Upload de imagen a ejercicio
- ✓ Validación de nombre único
- ✓ Validación de datos requeridos

### NUTRICIÓN (VALOR MEDIO)
**Casos para nutricionController.js:**
- ✓ Crear plan nutricional
- ✓ Obtener plan actual
- ✓ Actualizar plan existente
- ✓ Obtener historial de planes
- ✓ Eliminar plan

### API SERVICE (FRONTEND - CRÍTICO)
**Casos para frontend/src/services/api.js:**
- ✓ Interceptor agrega token en Authorization header
- ✓ Interceptor maneja errores 401 (logout automático)
- ✓ Token se obtiene de localStorage
- ✓ Llamadas POST correctas para login usuario/participante
- ✓ Llamadas GET correctas con parámetros opcionales
- ✓ FormData se envía correctamente en uploads
- ✓ Errores 404 se manejan con estructura vacía
- ✓ Promesas se resuelven/rechazan correctamente

### LOGINVIEW (FRONTEND - MEDIO)
**Casos para components/auth/LoginView.jsx:**
- ✓ Renderiza formulario de login
- ✓ Valida email requerido
- ✓ Valida contraseña requerida
- ✓ Toggle entre usuario/participante
- ✓ Muestra mensaje de error
- ✓ Deshabilita inputs durante loading
- ✓ Llama onLogin con parámetros correctos

---

## 5. HERRAMIENTAS RECOMENDADAS PARA EL STACK

### Backend - Node.js + Express
**Stack recomendado:**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",              // Test runner
    "supertest": "^6.3.3",          // Testing HTTP assertions
    "jest-mock-extended": "^3.0.0", // Mocking utilities
    "dotenv": "^16.3.1"             // Env vars en tests
  }
}
```

**Configuración jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

**Por qué Jest:**
- ✓ Excelente para Node.js
- ✓ Built-in mocking y spies
- ✓ Coverage reports integrado
- ✓ Snapshot testing
- ✓ Parallelización automática

**Por qué Supertest:**
- ✓ Assertions para HTTP responses
- ✓ Perfecto para testing Express
- ✓ Control de status codes
- ✓ Validación de headers y body

### Frontend - React
**Stack recomendado:**
```json
{
  "devDependencies": {
    "jest": "27.x",                    // Ya incluido en react-scripts
    "@testing-library/react": "^13.4", // React component testing
    "@testing-library/jest-dom": "^5.16", // DOM matchers
    "@testing-library/user-event": "^14", // Simular user interactions
    "jest-mock-axios": "^4.6.1"        // Mock axios calls
  }
}
```

**Por qué React Testing Library:**
- ✓ Test desde perspectiva del usuario
- ✓ Evita testing de implementación interna
- ✓ API simple y enfocada
- ✓ Accesibilidad integrada

### Configuración CI/CD (Recomendado)
**GitHub Actions workflow:**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci --prefix backend && npm ci --prefix frontend
      - run: npm run test:coverage --prefix backend
      - run: npm run test:coverage --prefix frontend
      - uses: codecov/codecov-action@v3
```

---

## 6. PRIORIZACIÓN DE TESTS A IMPLEMENTAR

### FASE 1 - CRÍTICA (Semana 1-2)
**Estimado: 40-60 tests**
Enfoque: Seguridad y funcionalidad core

1. **authController.js** (8 tests)
   - Login usuario/participante (válido, inválido, sin datos)
   - JWT generation y verificación
   - Registro de usuario (autorización)

2. **middleware/auth.js** (6 tests)
   - Token validation (válido, expirado, malformado)
   - Role-based access (trainer, admin)

3. **api.js (Frontend)** (10 tests)
   - Interceptores (request, response)
   - Token management
   - Error handling

4. **LoginView.jsx** (8 tests)
   - Form submission
   - Input validation
   - Error display
   - Loading state

### FASE 2 - ALTA (Semana 3-4)
**Estimado: 50-70 tests**
Enfoque: Gestión de datos principales

5. **participantesController.js** (12 tests)
   - CRUD operations
   - Paginación
   - Búsqueda/filtrado

6. **entrenamientoController.js** (15 tests)
   - Plan management
   - Registro de entrenamientos
   - Historial

7. **Routes layer** (15 tests)
   - Validación de entrada
   - Errores HTTP
   - Status codes

### FASE 3 - VALOR (Semana 5-6)
**Estimado: 30-40 tests**
Enfoque: Funcionalidades adicionales

8. **catalogoController.js** (8 tests)
9. **nutricionController.js** (8 tests)
10. **Componentes Frontend** (15 tests)
    - TrainerDashboard
    - TrainingPlanManager
    - ManageParticipant

### FASE 4 - MANTENIMIENTO (Continuo)
- Integration tests
- E2E tests con Cypress/Playwright
- Performance tests
- Cobertura > 80%

---

## 7. EJEMPLOS DE TESTS A ESCRIBIR

### Backend - Auth Login Test (Jest + Supertest)
```javascript
// backend/__tests__/controllers/authController.test.js
const request = require('supertest');
const app = require('../../server');
const { pool } = require('../../config/database');
const bcrypt = require('bcrypt');

jest.mock('../../config/database');

describe('authController.loginUsuario', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería loguear usuario con credenciales válidas', async () => {
    const usuarioMock = {
      id: 1,
      email: 'trainer@gym.com',
      nombre: 'Trainer Test',
      password: await bcrypt.hash('password123', 10),
      rol: 'entrenador',
      activo: true
    };

    pool.query.mockResolvedValueOnce([[usuarioMock]]);

    const response = await request(app)
      .post('/api/auth/login/usuario')
      .send({
        email: 'trainer@gym.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.usuario.email).toBe('trainer@gym.com');
    expect(response.body.usuario).not.toHaveProperty('password');
  });

  it('debería rechazar login sin credenciales', async () => {
    const response = await request(app)
      .post('/api/auth/login/usuario')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('requerido');
  });

  it('debería rechazar contraseña incorrecta', async () => {
    const usuarioMock = {
      id: 1,
      email: 'trainer@gym.com',
      password: await bcrypt.hash('correctPassword', 10),
      rol: 'entrenador'
    };

    pool.query.mockResolvedValueOnce([[usuarioMock]]);

    const response = await request(app)
      .post('/api/auth/login/usuario')
      .send({
        email: 'trainer@gym.com',
        password: 'wrongPassword'
      });

    expect(response.status).toBe(401);
  });
});
```

### Frontend - LoginView Test (React Testing Library)
```javascript
// frontend/src/components/auth/__tests__/LoginView.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from '../LoginView';

describe('LoginView', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    mockOnLogin.mockClear();
  });

  it('debería renderizar formulario de login', () => {
    render(<LoginView onLogin={mockOnLogin} />);

    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('debería validar email requerido', async () => {
    render(<LoginView onLogin={mockOnLogin} />);

    const submitButton = screen.getByRole('button', { name: /iniciar/i });
    fireEvent.click(submitButton);

    // HTML5 validation o validación manual según implementación
    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('debería toggle entre usuario y participante', async () => {
    render(<LoginView onLogin={mockOnLogin} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const emailInput = screen.getByPlaceholderText('tu@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await userEvent.type(emailInput, 'test@gym.com');
    await userEvent.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /iniciar/i });
    fireEvent.click(submitButton);

    expect(mockOnLogin).toHaveBeenCalledWith(
      'test@gym.com',
      'password123',
      true // participante = true
    );
  });

  it('debería mostrar mensaje de error', () => {
    render(
      <LoginView
        onLogin={mockOnLogin}
        error="Credenciales inválidas"
      />
    );

    expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('debería deshabilitar inputs durante loading', () => {
    render(<LoginView onLogin={mockOnLogin} loading={true} />);

    expect(screen.getByPlaceholderText('tu@email.com')).toBeDisabled();
    expect(screen.getByPlaceholderText('••••••••')).toBeDisabled();
  });
});
```

### API Service Test (Frontend)
```javascript
// frontend/src/services/__tests__/api.test.js
import api, { authService } from '../api';
import axios from 'axios';

jest.mock('axios');

describe('api service', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('authService.loginUsuario', () => {
    it('debería guardar token en localStorage', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-123',
          usuario: {
            id: 1,
            email: 'trainer@gym.com',
            nombre: 'Trainer',
            rol: 'entrenador'
          }
        }
      };

      // Simular respuesta exitosa
      api.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await authService.loginUsuario(
        'trainer@gym.com',
        'password123'
      );

      expect(localStorage.getItem('token')).toBe('jwt-token-123');
      expect(localStorage.getItem('user')).toContain('Trainer');
      expect(result.token).toBe('jwt-token-123');
    });

    it('debería agregar token en Authorization header', async () => {
      localStorage.setItem('token', 'test-token');

      const config = { headers: {} };
      // Simular interceptor
      const interceptor = api.interceptors.request.handlers[0];
      const newConfig = interceptor.fulfilled(config);

      expect(newConfig.headers.Authorization).toBe('Bearer test-token');
    });

    it('debería hacer logout en error 401', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', '{"id":1}');

      // Simular error 401
      const error = {
        response: { status: 401 }
      };

      const interceptor = api.interceptors.response.handlers[0];

      expect(() => interceptor.rejected(error)).toThrow();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
```

---

## 8. SCRIPTS NPM RECOMENDADOS

### Backend
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node scripts/initDatabase.js",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

### Frontend
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:debug": "react-scripts --inspect-brk test --runInBand"
  }
}
```

---

## 9. CONCLUSIONES Y RECOMENDACIONES

### Estado Actual
- **Cobertura:** 0% - CRÍTICO
- **Tests:** 0 tests propios implementados
- **Infrastructure:** Parcialmente lista (Jest en frontend vía react-scripts)
- **Riesgo:** ALTO - Sin tests es imposible garantizar calidad

### Acciones Inmediatas (SEMANA 1)
1. ✓ Instalar Jest + Supertest en backend
2. ✓ Crear estructura de directorios `__tests__`
3. ✓ Escribir 8 tests de autenticación
4. ✓ Configurar jest.config.js
5. ✓ Agregar script `npm run test:coverage`

### Timeline Sugerido
- **Fase 1 (2 semanas):** 40-60 tests críticos
- **Fase 2 (2 semanas):** 50-70 tests de valor
- **Fase 3 (2 semanas):** 30-40 tests finales
- **Meta:** 80%+ cobertura en 6 semanas

### ROI Esperado
- Reducción de bugs en producción: 60-80%
- Refactoring seguro
- Documentación automática
- Confianza en cambios
- Onboarding de nuevos devs más rápido

---

## 10. REFERENCIAS Y RECURSOS

### Documentación
- Jest: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest
- React Testing Library: https://testing-library.com/react
- Express Testing: https://expressjs.com/en/guide/testing.html

### Librerías Complementarias
- `jest-mock-extended` - Advanced mocking
- `jest-when` - Conditional mocking
- `fake-timers` - Time mocking
- `nock` - HTTP mocking
- `jest-localstorage-mock` - localStorage en tests

---

**Informe completado por:** Agente Tests Analyzer
**Para:** Team Lead (@gym-analysis)
**Prioridad:** ALTA - Implementación recomendada inmediatamente
