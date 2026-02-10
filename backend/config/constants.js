// Constantes de configuración de la aplicación

module.exports = {
  // Seguridad de contraseñas
  BCRYPT_ROUNDS: 12,
  PASSWORD_MIN_LENGTH: 8,
  
  // Límites de peticiones
  BODY_LIMIT: '10mb',
  
  // Paginación
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Rate limiting
  AUTH_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por ventana
    message: 'Demasiados intentos de login. Por favor, intenta de nuevo en 15 minutos.'
  },
  
  API_RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,
    max: 300 // 300 peticiones por 15 minutos (aumentado para permitir más interacción)
  }
};
