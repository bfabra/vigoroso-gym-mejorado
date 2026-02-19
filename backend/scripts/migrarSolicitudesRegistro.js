/**
 * Script de migración: Crea tabla solicitudes_registro para el flujo de auto-registro de participantes.
 *
 * Ejecutar: node backend/scripts/migrarSolicitudesRegistro.js
 *
 * Idempotente: puede ejecutarse varias veces sin romper datos existentes.
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function runQuery(connection, sql, label) {
  try {
    await connection.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (err) {
    if (
      err.code === 'ER_DUP_FIELDNAME' ||
      err.code === 'ER_TABLE_EXISTS_ERROR' ||
      (err.message && err.message.includes('Duplicate column name'))
    ) {
      console.log(`  ~ ${label} (ya existe, omitido)`);
    } else {
      throw err;
    }
  }
}

async function migrar() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'vigoroso_gym',
      port: process.env.DB_PORT || 3306,
      multipleStatements: false
    });

    console.log('Conectado a la base de datos');
    console.log('\n════════════════════════════════════════════');
    console.log('  Creando tabla solicitudes_registro');
    console.log('════════════════════════════════════════════');

    await runQuery(connection, `
      CREATE TABLE IF NOT EXISTS solicitudes_registro (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        telefono VARCHAR(20) DEFAULT NULL,
        fecha_nacimiento DATE DEFAULT NULL,
        genero ENUM('M','F','Otro') DEFAULT NULL,
        estado ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
        motivo_rechazo TEXT DEFAULT NULL,
        fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_resolucion TIMESTAMP NULL DEFAULT NULL,
        resuelto_por INT DEFAULT NULL,
        FOREIGN KEY (resuelto_por) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_email (email),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, 'CREATE TABLE solicitudes_registro');

    console.log('\n════════════════════════════════════════════');
    console.log('  Migración completada exitosamente');
    console.log('════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\nError en migración:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

migrar()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
