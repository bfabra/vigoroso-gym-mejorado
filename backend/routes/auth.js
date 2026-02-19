const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const solicitudesController = require('../controllers/solicitudesController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

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

// Validaciones para login
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  handleValidationErrors
];

// Validaciones para registro de usuario
const registroUsuarioValidation = [
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
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('rol')
    .optional()
    .isIn(['admin', 'entrenador']).withMessage('El rol debe ser admin o entrenador'),
  handleValidationErrors
];

// Validaciones para solicitud de cuenta
const solicitarCuentaValidation = [
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
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('telefono').optional({ nullable: true, checkFalsy: true }).trim(),
  body('fecha_nacimiento').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('genero').optional({ nullable: true, checkFalsy: true }).isIn(['M', 'F', 'Otro']).withMessage('Género inválido'),
  handleValidationErrors
];

// Rutas públicas
router.post('/login/usuario', loginValidation, authController.loginUsuario);
router.post('/login/participante', loginValidation, authController.loginParticipante);
router.post('/solicitar-cuenta', solicitarCuentaValidation, solicitudesController.solicitarCuenta);

// Rutas protegidas
router.post('/registrar-usuario', authenticateToken, isAdmin, registroUsuarioValidation, authController.registrarUsuario);
router.get('/verificar', authenticateToken, authController.verificarToken);

module.exports = router;
