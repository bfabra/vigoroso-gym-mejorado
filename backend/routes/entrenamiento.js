const express = require('express');
const router = express.Router();
const entrenamientoController = require('../controllers/entrenamientoController');
const { authenticateToken, isTrainer } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de planes de entrenamiento
router.get('/plan/:participante_id/:mes_anio', entrenamientoController.obtenerPlanEntrenamiento);
router.post('/plan', isTrainer, entrenamientoController.guardarPlanEntrenamiento);
router.get('/planes/:participante_id', entrenamientoController.obtenerPlanesParticipante);
router.delete('/plan/:id', isTrainer, entrenamientoController.eliminarPlan);

// Rutas de registros de entrenamiento
router.post('/registro', entrenamientoController.registrarEntrenamiento);
router.get('/registros', entrenamientoController.obtenerRegistros);
router.put('/registro/:id', entrenamientoController.actualizarRegistro);
router.delete('/registro/:id', entrenamientoController.eliminarRegistro);

// Rutas de historial de ejercicios
router.get('/historial/:participante_id/:ejercicio_plan_id', entrenamientoController.obtenerHistorialEjercicio);
router.get('/ultimo-registro/:participante_id/:ejercicio_plan_id', entrenamientoController.obtenerUltimoRegistro);

module.exports = router;
