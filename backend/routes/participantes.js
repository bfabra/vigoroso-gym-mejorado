const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const participantesController = require('../controllers/participantesController');
const { authenticateToken, isTrainer, isAdmin } = require('../middleware/auth');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Error de validación',
      detalles: errors.array() 
    });
  }
  next();
};

// Validaciones para crear participante
const crearParticipanteValidation = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('telefono')
    .optional()
    .trim()
    .isMobilePhone('es-CO').withMessage('Debe ser un número de teléfono válido'),
  body('fecha_nacimiento')
    .optional()
    .isDate().withMessage('Debe ser una fecha válida'),
  body('genero')
    .optional()
    .isIn(['M', 'F', 'Otro']).withMessage('El género debe ser M, F u Otro'),
  handleValidationErrors
];

// Validaciones para actualizar participante
const actualizarParticipanteValidation = [
  param('id').isInt().withMessage('ID debe ser un número'),
  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('telefono')
    .optional()
    .trim()
    .isMobilePhone('es-CO').withMessage('Debe ser un número de teléfono válido'),
  body('fecha_nacimiento')
    .optional()
    .isDate().withMessage('Debe ser una fecha válida'),
  body('genero')
    .optional()
    .isIn(['M', 'F', 'Otro']).withMessage('El género debe ser M, F u Otro'),
  handleValidationErrors
];

// Validación para cambiar contraseña
const cambiarPasswordValidation = [
  param('id').isInt().withMessage('ID debe ser un número'),
  body('nueva_password')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  handleValidationErrors
];

// Validación de ID en parámetros
const idValidation = [
  param('id').isInt().withMessage('ID debe ser un número'),
  handleValidationErrors
];

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de participantes (solo entrenadores)
router.get('/', isTrainer, participantesController.obtenerParticipantes);
router.get('/:id', idValidation, participantesController.obtenerParticipante);
router.post('/', isTrainer, crearParticipanteValidation, participantesController.crearParticipante);
router.put('/:id', isTrainer, actualizarParticipanteValidation, participantesController.actualizarParticipante);
router.delete('/:id', isTrainer, idValidation, participantesController.eliminarParticipante);
router.patch('/:id/cambiar-password', isTrainer, cambiarPasswordValidation, participantesController.cambiarPassword);

// Ruta para que el participante cambie su propia contraseña (verificando la actual)
router.patch('/mi-cuenta/cambiar-password',
  body('password_actual').notEmpty().withMessage('La contraseña actual es requerida'),
  body('password_nueva')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors,
  participantesController.cambiarPasswordPropia
);

// Ruta para que el participante actualice su email (verificando contraseña)
router.patch('/mi-cuenta/cambiar-email',
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  body('nuevo_email')
    .notEmpty().withMessage('El nuevo email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  handleValidationErrors,
  participantesController.cambiarEmailPropio
);

// Ruta para admin: cambiar email de cualquier participante
router.patch('/:id/cambiar-email', isAdmin,
  body('nuevo_email')
    .notEmpty().withMessage('El nuevo email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  handleValidationErrors,
  participantesController.cambiarEmail
);

module.exports = router;
