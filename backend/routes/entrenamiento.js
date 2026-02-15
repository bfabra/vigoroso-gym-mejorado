const express = require('express');
const router = express.Router();
const entrenamientoController = require('../controllers/entrenamientoController');
const { authenticateToken, isTrainer } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de imágenes de ejercicios (solo entrenadores/admin)
router.post('/ejercicio/imagen', isTrainer, (req, res, next) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'La imagen no debe superar 5MB' });
      }
      if (err.message === 'Solo se permiten archivos JPG y GIF') {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Error al procesar la imagen' });
    }
    next();
  });
}, entrenamientoController.subirImagenEjercicio);
router.delete('/ejercicio/imagen', isTrainer, entrenamientoController.eliminarImagenEjercicio);

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
