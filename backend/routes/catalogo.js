const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogoController');
const { authenticateToken, isTrainer } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateToken);

// Lectura - cualquier usuario autenticado
router.get('/', catalogoController.listarEjercicios);
router.get('/:id', catalogoController.obtenerEjercicio);

// Escritura - solo entrenadores/admin
router.post('/', isTrainer, catalogoController.crearEjercicio);
router.put('/:id', isTrainer, catalogoController.actualizarEjercicio);
router.delete('/:id', isTrainer, catalogoController.eliminarEjercicio);

// Imágenes - solo entrenadores/admin
router.post('/:id/imagen', isTrainer, (req, res, next) => {
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
}, catalogoController.subirImagenCatalogo);
router.delete('/:id/imagen/:slot', isTrainer, catalogoController.eliminarImagenCatalogo);

module.exports = router;
