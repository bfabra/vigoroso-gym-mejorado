const express = require('express');
const router = express.Router();
const plantillasController = require('../controllers/plantillasController');
const { authenticateToken, isTrainer } = require('../middleware/auth');

router.use(authenticateToken);

// Lectura - cualquier usuario autenticado
router.get('/', plantillasController.listarPlantillas);
router.get('/:id', plantillasController.obtenerPlantilla);

// Escritura - solo entrenadores/admin
router.post('/', isTrainer, plantillasController.crearPlantilla);
router.put('/:id', isTrainer, plantillasController.actualizarPlantilla);
router.delete('/:id', isTrainer, plantillasController.eliminarPlantilla);
router.post('/:id/duplicar', isTrainer, plantillasController.duplicarPlantilla);

module.exports = router;
