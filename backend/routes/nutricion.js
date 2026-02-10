const express = require('express');
const router = express.Router();
const nutricionController = require('../controllers/nutricionController');
const { authenticateToken, isTrainer } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de planes de nutrición
router.get('/plan/:participante_id', nutricionController.obtenerPlanNutricion);
router.post('/plan', isTrainer, nutricionController.guardarPlanNutricion);
router.put('/plan/:id', isTrainer, nutricionController.actualizarPlanNutricion);
router.get('/historial/:participante_id', nutricionController.obtenerHistorialPlanes);
router.delete('/plan/:id', isTrainer, nutricionController.eliminarPlan);

module.exports = router;
