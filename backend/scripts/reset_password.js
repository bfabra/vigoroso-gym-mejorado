/**
 * Script para resetear la contraseña de un participante
 * Uso: node scripts/reset_password.js <email> <nueva_contraseña>
 */

require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const { BCRYPT_ROUNDS } = require('../config/constants');

async function resetPassword(email, nuevaPassword) {
  try {
    console.log('🔐 Reseteando contraseña para:', email);

    // Verificar que el participante existe
    const [participantes] = await pool.query(
      'SELECT id, nombre, email FROM participantes WHERE email = ?',
      [email]
    );

    if (participantes.length === 0) {
      console.error('❌ Participante no encontrado con email:', email);
      process.exit(1);
    }

    const participante = participantes[0];
    console.log('✅ Participante encontrado:', participante.nombre, `(ID: ${participante.id})`);

    // Hashear la nueva contraseña
    console.log('🔒 Hasheando nueva contraseña...');
    const hashedPassword = await bcrypt.hash(nuevaPassword, BCRYPT_ROUNDS);
    console.log('✅ Contraseña hasheada:', hashedPassword.substring(0, 20) + '...');

    // Actualizar la contraseña
    const [result] = await pool.query(
      'UPDATE participantes SET password = ? WHERE id = ?',
      [hashedPassword, participante.id]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Contraseña actualizada exitosamente');
      console.log('');
      console.log('📋 Detalles:');
      console.log('  - Email:', email);
      console.log('  - Nueva contraseña:', nuevaPassword);
      console.log('  - ID Participante:', participante.id);
      console.log('');
      console.log('✅ El participante ahora puede iniciar sesión con la nueva contraseña.');
    } else {
      console.error('❌ No se pudo actualizar la contraseña');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Obtener parámetros de línea de comandos
const email = process.argv[2];
const nuevaPassword = process.argv[3];

if (!email || !nuevaPassword) {
  console.log('Uso: node scripts/reset_password.js <email> <nueva_contraseña>');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node scripts/reset_password.js fabraidee@gmail.com MiNuevaPassword123');
  process.exit(1);
}

// Ejecutar
resetPassword(email, nuevaPassword);
