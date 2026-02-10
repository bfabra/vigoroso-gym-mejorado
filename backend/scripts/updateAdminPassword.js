require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const hash = '$2b$10$jye/cXVrCVB1Trecdd3Qf.zWQdx7RDiDA7cR9m/4zykqmCGpnQTuq';
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });

    await conn.query('USE ' + (process.env.DB_NAME || 'vigoroso_gym'));
    await conn.query('UPDATE usuarios SET password = ? WHERE email = ?', [hash, 'admin@gmail.com']);
    const [rows] = await conn.query('SELECT id, email, activo, password FROM usuarios WHERE email = ?', ['admin@gmail.com']);
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
  } catch (err) {
    console.error('Error updating admin password:', err);
    process.exit(1);
  }
})();
