const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const solicitudesController = require('../controllers/solicitudesController');

// Todas las rutas requieren autenticación de admin
router.use(authenticateToken, isAdmin);

router.get('/', solicitudesController.listarSolicitudes);
router.post('/:id/aprobar', solicitudesController.aprobarSolicitud);
router.post('/:id/rechazar', solicitudesController.rechazarSolicitud);

module.exports = router;
