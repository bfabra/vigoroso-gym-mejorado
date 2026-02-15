const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Validar variables de entorno al inicio
const { validateEnv } = require('./config/env');
validateEnv();

const { testConnection } = require('./config/database');
const { BODY_LIMIT, AUTH_RATE_LIMIT, API_RATE_LIMIT } = require('./config/constants');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const participantesRoutes = require('./routes/participantes');
const entrenamientoRoutes = require('./routes/entrenamiento');
const nutricionRoutes = require('./routes/nutricion');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser con límites de seguridad
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Servir archivos estáticos (imágenes de ejercicios)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting global para la API
const apiLimiter = rateLimit({
  windowMs: API_RATE_LIMIT.windowMs,
  max: API_RATE_LIMIT.max,
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  // Excluir rutas de solo lectura de historial del rate limit estricto
  skip: (req) => {
    return req.path.includes('/historial/') || req.path.includes('/ultimo-registro/');
  }
});

app.use('/api/', apiLimiter);

// Rate limiting específico para autenticación (más estricto)
const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT.windowMs,
  max: AUTH_RATE_LIMIT.max,
  message: AUTH_RATE_LIMIT.message,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Solo cuenta intentos fallidos
});

app.use('/api/auth/login', authLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/participantes', participantesRoutes);
app.use('/api/entrenamiento', entrenamientoRoutes);
app.use('/api/nutricion', nutricionRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Gimnasio VIGOROSO funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta por defecto
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Gimnasio VIGOROSO',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      participantes: '/api/participantes',
      entrenamiento: '/api/entrenamiento',
      nutricion: '/api/nutricion',
      health: '/api/health'
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  // Log del error (no exponer detalles sensibles)
  logger.error(`Error en ${req.method} ${req.path}:`, {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    user: req.user?.id,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(__dirname, 'uploads', 'ejercicios');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      logger.info('Directorio de uploads creado: ' + uploadsDir);
    }

    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.error('No se pudo conectar a la base de datos. Verifica la configuración.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════╗');
      console.log('║     🏋️  GIMNASIO VIGOROSO API 🏋️         ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API disponible en: http://localhost:${PORT}`);
      console.log('════════════════════════════════════════');
      
      logger.info(`Servidor iniciado en puerto ${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
