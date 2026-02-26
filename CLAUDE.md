# CLAUDE.md — Vigoroso Gym Management System

This document provides context for AI assistants working in this codebase. It covers project structure, tech stack, development workflows, coding conventions, and key architectural decisions.

---

## Project Overview

**Vigoroso Gym** is a full-stack gym management system with two user roles:
- **Trainers / Admins** — manage participants, assign training and nutrition plans, manage catalogs and templates
- **Participants** — view their plans and log workout data

All UI text, comments, and messages are in **Spanish**.

---

## Repository Layout

```
vigoroso-gym-mejorado/
├── backend/          # Node.js + Express REST API (port 3001)
├── frontend/         # React 18 SPA (port 3000)
├── database.sql      # Full database schema (MySQL)
├── README.md
├── INSTALACION.md
├── API_DOCUMENTATION.md
└── ...               # Other Spanish-language docs
```

---

## Tech Stack

### Backend (`/backend`)
| Concern | Tool |
|---|---|
| Runtime | Node.js |
| Framework | Express.js ^4.18.2 |
| Database | MySQL 8+ via `mysql2/promise` |
| Auth | JWT (`jsonwebtoken`) + bcrypt (12 rounds) |
| Validation | `express-validator` |
| Security | Helmet, CORS, `express-rate-limit` |
| Logging | Winston (file-based with rotation) |
| File Uploads | Multer |
| Dev reload | nodemon |

### Frontend (`/frontend`)
| Concern | Tool |
|---|---|
| Framework | React 18 |
| HTTP client | Axios (with interceptors) |
| State | React hooks only (no Redux / Context API) |
| Build tool | react-scripts (CRA) |
| Linting | ESLint via `react-app` preset |

---

## Development Workflow

### Start for Development

```bash
# 1. Start the backend
cd backend
npm run dev       # nodemon on port 3001

# 2. Start the frontend (separate terminal)
cd frontend
npm start         # react-scripts on port 3000 (proxies /api → port 3001)
```

### Initialize the Database (first time only)

```bash
cd backend
node scripts/initDatabase.js
```

This creates the MySQL database, all tables, and a default admin account:
- **Email:** `admin@gmail.com`
- **Password:** `admin123`

### Build for Production

```bash
cd frontend
npm run build     # outputs to frontend/build/
```

### Run Tests

```bash
cd frontend
npm test          # Jest via react-scripts

# Backend tests are not currently configured
```

---

## Environment Variables

Create `/backend/.env` before starting the backend. Required variables:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vigoroso_gym
DB_PORT=3306
JWT_SECRET=your_32_plus_char_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
PORT=3001
```

The backend validates all required variables at startup via `/backend/config/env.js` and will exit with a descriptive error if any are missing.

---

## Backend Architecture

### Directory Structure

```
backend/
├── config/
│   ├── database.js          # MySQL connection pool (10 max connections)
│   ├── env.js               # Environment validation on startup
│   └── constants.js         # BCRYPT_ROUNDS (12), rate limits, pagination defaults
├── controllers/             # Business logic (one file per domain)
│   ├── authController.js
│   ├── participantesController.js
│   ├── entrenamientoController.js       # Legacy training system
│   ├── entrenamientoControllerNuevo.js  # v2 training system
│   ├── nutricionController.js
│   ├── plantillasController.js
│   ├── catalogoController.js
│   ├── asignacionesController.js
│   └── solicitudesController.js
├── routes/                  # Express routers (one file per domain)
│   ├── auth.js              # /api/auth/*
│   ├── participantes.js     # /api/participantes/*
│   ├── entrenamiento.js     # /api/entrenamiento/*  (legacy)
│   ├── entrenamientoNuevo.js # /api/entrenamiento-v2/*
│   ├── nutricion.js         # /api/nutricion/*
│   ├── plantillas.js        # /api/plantillas/*
│   ├── catalogo.js          # /api/catalogo/*
│   ├── asignaciones.js      # /api/asignaciones/*
│   ├── solicitudes.js       # /api/solicitudes/*
│   └── usuarios.js          # /api/usuarios/*
├── middleware/
│   ├── auth.js              # authenticateToken, isTrainer, isAdmin
│   └── upload.js            # Multer config for exercise images
├── utils/
│   ├── asyncHandler.js      # Wraps async route handlers (removes try-catch boilerplate)
│   └── logger.js            # Winston logger instance
├── scripts/                 # DB init and migration scripts
└── server.js                # Express app entry point
```

### Key Patterns

**Async error handling** — always wrap controller functions with `asyncHandler`:
```js
const asyncHandler = require('../utils/asyncHandler');

exports.myAction = asyncHandler(async (req, res) => {
  // No try-catch needed — errors bubble to global handler
  const result = await db.query(...);
  res.json(result);
});
```

**Role-based middleware** — use the exported middleware from `middleware/auth.js`:
```js
router.get('/ruta', authenticateToken, isTrainer, controller.action);
router.get('/admin-ruta', authenticateToken, isAdmin, controller.action);
```

**Validation** — use `express-validator` chains in route files, check errors in controller:
```js
// route file
const { body, validationResult } = require('express-validator');
router.post('/', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 })
], controller.create);

// controller
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
```

**Logging** — use the shared Winston logger, never `console.log` in production code:
```js
const logger = require('../utils/logger');
logger.info('Message', { userId: req.user.id });
logger.error('Error message', { error: err.message });
```

### Rate Limiting

- **Auth routes** (`/api/auth/*`): 5 requests per 15 minutes
- **All other routes**: 300 requests per 15 minutes

---

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/
│   ├── auth/
│   │   ├── LoginView.jsx          # Login form for trainers and participants
│   │   └── SolicitudRegistroForm.jsx # New participant registration request
│   ├── trainer/
│   │   ├── TrainerDashboard.jsx   # Main trainer view
│   │   ├── ManageParticipant.jsx
│   │   ├── ManageCredentials.jsx
│   │   ├── ExerciseCatalogManager.jsx
│   │   └── TemplateCatalogManager.jsx
│   ├── participant/
│   │   └── ParticipantDashboard.jsx
│   ├── training/
│   │   ├── TrainingPlanManager.jsx  # Legacy training plans
│   │   ├── PlanV2Manager.jsx        # v2 training plans
│   │   └── TemplateAssigner.jsx
│   ├── nutrition/
│   │   └── NutritionPlanManager.jsx
│   └── common/
│       └── Icons.jsx               # SVG icon components
├── services/
│   └── api.js                     # Axios instance + service objects
├── constants/
│   ├── ejercicios.js              # Exercise catalog data
│   └── plantillas.js              # Training template data
├── App.js                         # Top-level routing
├── App.css
└── index.js
```

### Key Patterns

**API service layer** — all HTTP calls go through `/services/api.js`. Never call axios directly from components:
```js
// services/api.js already handles auth headers and 401 redirects
import { participantesService } from '../services/api';

const data = await participantesService.getAll();
```

**Authentication state** — stored in `localStorage`:
- `localStorage.getItem('token')` — JWT Bearer token
- `localStorage.getItem('usuario')` — JSON-stringified user object

The Axios request interceptor injects the token automatically. The response interceptor clears storage and redirects on 401.

**Component state** — use `useState` and `useEffect` only. No Redux or Context API:
```jsx
const [participantes, setParticipantes] = useState([]);

useEffect(() => {
  participantesService.getAll().then(setParticipantes);
}, []);
```

**App-level routing** — `App.js` switches views based on `currentView` state. Adding a new top-level view requires updating `App.js`.

---

## Database Schema

MySQL database: `vigoroso_gym`

| Table | Purpose |
|---|---|
| `usuarios` | Trainers and admins (`rol`: `admin` \| `entrenador`) |
| `participantes` | Gym members (linked to a trainer via `usuario_creador_id`) |
| `planes_entrenamiento` | Monthly training plans (key: `participante_id`, `mes_año` YYYY-MM) |
| `ejercicios_plan` | Exercises within a plan (6 per day, `dia_semana` Mon–Sat) |
| `registros_entrenamiento` | Daily workout logs by participants |
| `planes_nutricion` | Nutrition plans (one active per participant) |
| `comidas_plan` | Meals within a nutrition plan (5 meal types × 2 options) |

Columns use `snake_case`. Tables use soft deletes (`activo` boolean column).

---

## API Overview

Base URL: `http://localhost:3001/api`

All protected routes require `Authorization: Bearer <token>` header.

| Prefix | Description | Auth Required |
|---|---|---|
| `/api/auth` | Login, registration requests | No |
| `/api/participantes` | CRUD for gym members | Trainer |
| `/api/entrenamiento` | Legacy training plan system | Trainer / Participant |
| `/api/entrenamiento-v2` | New training system (catalog-based) | Trainer / Participant |
| `/api/nutricion` | Nutrition plans | Trainer / Participant |
| `/api/plantillas` | Training plan templates | Trainer |
| `/api/catalogo` | Exercise catalog with images | Trainer |
| `/api/asignaciones` | Template-to-participant assignments (v2) | Trainer |
| `/api/solicitudes` | Registration request approvals | Trainer |
| `/api/usuarios` | User (trainer/admin) management | Admin |
| `/api/uploads` | Static file serving for exercise images | Public |

Full endpoint details are in `API_DOCUMENTATION.md`.

---

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Backend files | `camelCase` | `participantesController.js` |
| React components | `PascalCase.jsx` | `TrainerDashboard.jsx` |
| Database tables | `snake_case` | `planes_entrenamiento` |
| Database columns | `snake_case` | `usuario_creador_id` |
| Constants file exports | `UPPER_SNAKE_CASE` | `BCRYPT_ROUNDS` |
| Middleware functions | `camelCase` | `authenticateToken` |
| API service objects | `camelCase + Service` | `participantesService` |

---

## Dual Training System

The project maintains two training systems side-by-side for backwards compatibility:

| | Legacy (`/api/entrenamiento`) | v2 (`/api/entrenamiento-v2`, `/api/asignaciones`) |
|---|---|---|
| Controller | `entrenamientoController.js` | `entrenamientoControllerNuevo.js` |
| Plan structure | Monthly plans with daily exercises | Catalog-based with template assignment |
| Frontend | `TrainingPlanManager.jsx` | `PlanV2Manager.jsx`, `TemplateAssigner.jsx` |

When working on training features, clarify which system is involved. New development should target v2.

---

## File Uploads

Exercise images are uploaded via `Multer` and served statically:
- **Upload directory:** `/backend/uploads/ejercicios/`
- **Served at:** `/api/uploads/ejercicios/<filename>`
- **Limit:** 3 images per exercise

---

## Security Guidelines

- Never log passwords, tokens, or PII — the Winston logger is configured to avoid this
- Always hash passwords with bcrypt using `BCRYPT_ROUNDS` from `constants.js`
- Validate all user input with `express-validator` before using it in queries
- Use parameterized queries (mysql2 `?` placeholders) — never string-interpolate SQL
- The `isTrainer` and `isAdmin` middleware must be applied to all protected routes
- Do not commit `.env` files (already in `.gitignore`)

---

## Known Gaps / Future Work

- **No automated tests** — backend has no test suite; frontend Jest support exists but is unused
- **No CI/CD pipeline** — no GitHub Actions or similar automation
- **No Docker** — local MySQL installation required
- **No `.env.example`** — environment variables are documented in `README.md` and above
- **No TypeScript** — both frontend and backend use plain JavaScript
- **No Swagger/OpenAPI** — API documented in `API_DOCUMENTATION.md` only

---

## Useful Commands Reference

```bash
# Backend
cd backend && npm run dev          # Start dev server with hot reload
cd backend && npm start            # Start production server
cd backend && node scripts/initDatabase.js  # Initialize DB schema + admin user

# Frontend
cd frontend && npm start           # Start dev server (http://localhost:3000)
cd frontend && npm run build       # Production build

# Database migrations (run from backend/)
node scripts/migrarModeloEntrenamiento.js
node scripts/migrarPlantillas.js
node scripts/migrarCatalogo.js
node scripts/migrarSolicitudesRegistro.js
node scripts/crearDatosPrueba.js   # Seed test data
```
