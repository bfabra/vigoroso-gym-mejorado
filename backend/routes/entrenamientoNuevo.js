const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const entrenamientoController = require('../controllers/entrenamientoControllerNuevo');
const { authenticateToken, isTrainer } = require('../middleware/auth');

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

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ========================================
// PLANES DE ENTRENAMIENTO
// ========================================

// Obtener todos los planes de un participante
router.get('/planes/participante/:participante_id',
  param('participante_id').isInt(),
  handleValidationErrors,
  entrenamientoController.obtenerPlanesParticipante
);

// Obtener un plan completo con días y ejercicios
router.get('/plan/:plan_id',
  param('plan_id').isInt(),
  handleValidationErrors,
  entrenamientoController.obtenerPlanCompleto
);

// Crear un plan completo (solo entrenadores)
router.post('/plan',
  isTrainer,
  [
    body('participante_id').isInt().withMessage('ID de participante inválido'),
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('objetivo').optional().trim(),
    body('nivel').optional().isIn(['Principiante', 'Intermedio', 'Avanzado']),
    body('duracion_semanas').optional().isInt({ min: 1, max: 52 }),
    body('dias').isArray().withMessage('Debe proporcionar al menos un día'),
    body('dias.*.numero_dia').isInt({ min: 1 }).withMessage('Número de día inválido'),
    body('dias.*.nombre').trim().notEmpty().withMessage('El nombre del día es requerido'),
    body('dias.*.ejercicios').isArray().withMessage('Cada día debe tener ejercicios'),
    body('dias.*.ejercicios.*.nombre_ejercicio').trim().notEmpty(),
    body('dias.*.ejercicios.*.series').isInt({ min: 1, max: 10 }),
    body('dias.*.ejercicios.*.repeticiones').trim().notEmpty(),
  ],
  handleValidationErrors,
  entrenamientoController.crearPlanCompleto
);

// Actualizar plan (solo entrenadores)
router.put('/plan/:plan_id',
  isTrainer,
  param('plan_id').isInt(),
  handleValidationErrors,
  entrenamientoController.actualizarPlan
);

// Eliminar plan (solo entrenadores)
router.delete('/plan/:plan_id',
  isTrainer,
  param('plan_id').isInt(),
  handleValidationErrors,
  entrenamientoController.eliminarPlan
);

// ========================================
// DÍAS DE ENTRENAMIENTO
// ========================================

// Agregar día a un plan (solo entrenadores)
router.post('/plan/:plan_id/dia',
  isTrainer,
  [
    param('plan_id').isInt(),
    body('numero_dia').isInt({ min: 1 }),
    body('nombre').trim().notEmpty(),
  ],
  handleValidationErrors,
  entrenamientoController.agregarDia
);

// Actualizar día (solo entrenadores)
router.put('/dia/:dia_id',
  isTrainer,
  param('dia_id').isInt(),
  handleValidationErrors,
  entrenamientoController.actualizarDia
);

// Eliminar día (solo entrenadores)
router.delete('/dia/:dia_id',
  isTrainer,
  param('dia_id').isInt(),
  handleValidationErrors,
  entrenamientoController.eliminarDia
);

// ========================================
// EJERCICIOS
// ========================================

// Agregar ejercicio a un día (solo entrenadores)
router.post('/dia/:dia_id/ejercicio',
  isTrainer,
  [
    param('dia_id').isInt(),
    body('nombre_ejercicio').trim().notEmpty(),
    body('series').isInt({ min: 1, max: 10 }),
    body('repeticiones').trim().notEmpty(),
  ],
  handleValidationErrors,
  entrenamientoController.agregarEjercicio
);

// Actualizar ejercicio (solo entrenadores)
router.put('/ejercicio/:ejercicio_id',
  isTrainer,
  [
    param('ejercicio_id').isInt(),
    body('nombre_ejercicio').trim().notEmpty(),
    body('series').isInt({ min: 1, max: 10 }),
    body('repeticiones').trim().notEmpty(),
  ],
  handleValidationErrors,
  entrenamientoController.actualizarEjercicio
);

// Eliminar ejercicio (solo entrenadores)
router.delete('/ejercicio/:ejercicio_id',
  isTrainer,
  param('ejercicio_id').isInt(),
  handleValidationErrors,
  entrenamientoController.eliminarEjercicio
);

// ========================================
// REGISTROS DE ENTRENAMIENTO
// ========================================

// Registrar ejecución de ejercicio (participantes y entrenadores)
router.post('/registro',
  [
    body('participante_id').isInt(),
    body('ejercicio_dia_id').isInt(),
    body('fecha').isDate(),
    body('series_completadas').optional().isInt({ min: 0 }),
    body('dificultad').optional().isIn(['Fácil', 'Moderado', 'Difícil', 'Muy Difícil']),
  ],
  handleValidationErrors,
  entrenamientoController.registrarEjercicio
);

// Obtener historial de un ejercicio
router.get('/historial/:participante_id/:ejercicio_dia_id',
  [
    param('participante_id').isInt(),
    param('ejercicio_dia_id').isInt(),
  ],
  handleValidationErrors,
  entrenamientoController.obtenerHistorialEjercicio
);

// Obtener progreso de un participante en un plan
router.get('/progreso/:participante_id/:plan_id',
  [
    param('participante_id').isInt(),
    param('plan_id').isInt(),
  ],
  handleValidationErrors,
  entrenamientoController.obtenerProgresoParticipante
);

module.exports = router;
