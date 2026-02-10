// Validación de variables de entorno requeridas
function validateEnv() {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_EXPIRES_IN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Error: Faltan las siguientes variables de entorno:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Crea un archivo .env con estas variables antes de continuar.');
    process.exit(1);
  }
  
  // Validar longitud del JWT_SECRET
  if (process.env.JWT_SECRET.length < 32) {
    console.error('⚠️  Error: JWT_SECRET debe tener al menos 32 caracteres para ser seguro.');
    console.error('💡 Genera uno seguro con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  console.log('✅ Variables de entorno validadas correctamente');
}

module.exports = { validateEnv };
