const express = require('express');
const router = express.Router();
const asignacionesController = require('../controllers/asignacionesController');
const { authenticateToken, isTrainer } = require('../middleware/auth');

router.use(authenticateToken);

// Asignaciones - solo entrenadores/admin pueden asignar
router.post('/', isTrainer, asignacionesController.asignarPlantilla);
router.put('/:id', isTrainer, asignacionesController.cambiarAsignacion);

// Consultas de asignaciones - cualquier autenticado
router.get('/participante/:participante_id', asignacionesController.obtenerHistorialAsignaciones);
router.get('/participante/:participante_id/actual', asignacionesController.obtenerPlanActual);
router.get('/participante/:participante_id/:mes_anio', asignacionesController.obtenerAsignacion);

// Registros de entrenamiento v2
router.post('/registro', asignacionesController.registrarEntrenamientoV2);
router.get('/registros', asignacionesController.obtenerRegistrosV2);
router.put('/registro/:id', asignacionesController.actualizarRegistroV2);
router.delete('/registro/:id', asignacionesController.eliminarRegistroV2);

// Historial de ejercicios v2
router.get('/historial/:participante_id/:snapshot_ejercicio_id', asignacionesController.obtenerHistorialEjercicioV2);
router.get('/ultimo-registro/:participante_id/:snapshot_ejercicio_id', asignacionesController.obtenerUltimoRegistroV2);

module.exports = router;
