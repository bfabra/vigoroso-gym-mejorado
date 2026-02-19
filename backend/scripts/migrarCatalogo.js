/**
 * Script de migración: Poblar catalogo_ejercicios
 * Combina ejercicios de EJERCICIOS_COMUNES + ejercicios de planes existentes en BD
 *
 * Ejecutar: node scripts/migrarCatalogo.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Catálogo base (equivalente a frontend/src/constants/ejercicios.js)
const EJERCICIOS_COMUNES = {
  'Pecho': [
    'Press de Banca', 'Press Inclinado', 'Press Declinado',
    'Aperturas con Mancuernas', 'Fondos en Paralelas', 'Cruce de Poleas',
    'Press con Mancuernas', 'Pullover'
  ],
  'Espalda': [
    'Dominadas', 'Jalón al Pecho', 'Remo con Barra', 'Remo con Mancuerna',
    'Peso Muerto', 'Jalón Agarre Cerrado', 'Remo en Polea'
  ],
  'Hombros': [
    'Press Militar', 'Elevaciones Laterales', 'Elevaciones Frontales',
    'Pájaros', 'Press Arnold', 'Remo al Mentón', 'Face Pull'
  ],
  'Piernas': [
    'Sentadilla', 'Prensa', 'Extensiones de Cuádriceps', 'Curl Femoral',
    'Zancadas', 'Peso Muerto Rumano', 'Elevación de Talones', 'Hip Thrust'
  ],
  'Brazos': [
    'Curl de Bíceps con Barra', 'Curl con Mancuernas', 'Curl Martillo',
    'Curl Predicador', 'Extensiones de Tríceps', 'Press Francés',
    'Fondos', 'Curl en Polea'
  ],
  'Core': [
    'Abdominales', 'Plancha', 'Elevación de Piernas',
    'Russian Twist', 'Mountain Climbers', 'Bicicleta'
  ]
};

// Ejercicios adicionales que aparecen en las plantillas pero no en EJERCICIOS_COMUNES
const EJERCICIOS_PLANTILLAS = {
  'Espalda': ['Halones Cerrados'],
  'Piernas': [
    'Sentadilla en Haka', 'Zancada', 'Sentadilla en Smith', 'Sentadilla Sisi',
    'Sentadilla Sumo', 'Peso Muerto Unilateral', 'Aductor',
    'Elevación de Pantorrilla', 'Sentadilla Búlgara',
    'Peso Muerto Unilateral para Glúteo', 'Elevaciones Pélvicas (Hip Thrust)',
    'Patada de Glúteo en Polea', 'Abductor', 'Leg Curl (Curl Femoral)'
  ],
  'Pecho': ['Press con Mancuerna y Push Down', 'Flexiones (Push Ups)'],
  'Hombros': ['Vuelos Laterales y Elevaciones Frontales'],
  'Brazos': [
    'Curl de Bíceps con Mancuerna', 'Copa (Press Francés)'
  ],
  'Core': [
    'Zig Zag (Mountain Climbers)', 'Plancha Frontal',
    'Crunch Tocando Tobillos', 'Planchas Laterales'
  ],
  'Movilidad': ['Estiramientos'],
  'Cardio': ['Cardio', 'Movilidad Articular']
};

async function migrarCatalogo() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'vigoroso_gym',
      port: process.env.DB_PORT || 3306
    });

    console.log('Conectado a la base de datos');

    let insertados = 0;
    let duplicados = 0;

    // Insertar desde EJERCICIOS_COMUNES
    for (const [grupo, ejercicios] of Object.entries(EJERCICIOS_COMUNES)) {
      for (const nombre of ejercicios) {
        try {
          await connection.query(
            'INSERT INTO catalogo_ejercicios (nombre, grupo_muscular) VALUES (?, ?)',
            [nombre, grupo]
          );
          insertados++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            duplicados++;
          } else {
            throw err;
          }
        }
      }
    }

    // Insertar ejercicios adicionales de plantillas
    for (const [grupo, ejercicios] of Object.entries(EJERCICIOS_PLANTILLAS)) {
      for (const nombre of ejercicios) {
        try {
          await connection.query(
            'INSERT INTO catalogo_ejercicios (nombre, grupo_muscular) VALUES (?, ?)',
            [nombre, grupo]
          );
          insertados++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            duplicados++;
          } else {
            throw err;
          }
        }
      }
    }

    // Importar ejercicios únicos desde planes existentes en BD
    const [existentes] = await connection.query(
      `SELECT DISTINCT nombre_ejercicio FROM ejercicios_plan
       WHERE nombre_ejercicio IS NOT NULL AND nombre_ejercicio != ''`
    );

    for (const row of existentes) {
      try {
        // Intentar categorizar buscando coincidencia parcial
        let grupo = 'Core'; // default
        const nombre = row.nombre_ejercicio;
        const lower = nombre.toLowerCase();

        if (lower.includes('press de banca') || lower.includes('pecho') || lower.includes('apertura') || lower.includes('push up') || lower.includes('flexion')) {
          grupo = 'Pecho';
        } else if (lower.includes('dominad') || lower.includes('jalón') || lower.includes('halon') || lower.includes('remo') || lower.includes('pullover') || lower.includes('espalda')) {
          grupo = 'Espalda';
        } else if (lower.includes('militar') || lower.includes('lateral') || lower.includes('frontal') || lower.includes('hombro') || lower.includes('arnold') || lower.includes('face pull')) {
          grupo = 'Hombros';
        } else if (lower.includes('sentadilla') || lower.includes('pierna') || lower.includes('cuádricep') || lower.includes('femoral') || lower.includes('zancad') || lower.includes('prensa') || lower.includes('glúteo') || lower.includes('hip thrust') || lower.includes('pantorrilla') || lower.includes('talón') || lower.includes('aductor') || lower.includes('abductor') || lower.includes('búlgara') || lower.includes('peso muerto')) {
          grupo = 'Piernas';
        } else if (lower.includes('curl') || lower.includes('bíceps') || lower.includes('tríceps') || lower.includes('francés') || lower.includes('copa') || lower.includes('brazo')) {
          grupo = 'Brazos';
        } else if (lower.includes('plancha') || lower.includes('abdominal') || lower.includes('crunch') || lower.includes('mountain') || lower.includes('twist') || lower.includes('core')) {
          grupo = 'Core';
        } else if (lower.includes('cardio') || lower.includes('trotar') || lower.includes('bicicleta estática')) {
          grupo = 'Cardio';
        } else if (lower.includes('estiramiento') || lower.includes('movilidad')) {
          grupo = 'Movilidad';
        }

        await connection.query(
          'INSERT INTO catalogo_ejercicios (nombre, grupo_muscular) VALUES (?, ?)',
          [nombre, grupo]
        );
        insertados++;
        console.log(`  + ${nombre} → ${grupo}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          duplicados++;
        } else {
          throw err;
        }
      }
    }

    // Resumen
    const [total] = await connection.query('SELECT COUNT(*) as total FROM catalogo_ejercicios');
    console.log('\n════════════════════════════════════');
    console.log(`  Insertados: ${insertados}`);
    console.log(`  Duplicados (omitidos): ${duplicados}`);
    console.log(`  Total en catálogo: ${total[0].total}`);
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

migrarCatalogo()
  .then(() => {
    console.log('Migración de catálogo completada');
    process.exit(0);
  })
  .catch(() => process.exit(1));
