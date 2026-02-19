/**
 * Script de migración: Convertir plantillas hardcodeadas a registros en BD
 * Requiere que migrarCatalogo.js se haya ejecutado primero.
 *
 * Ejecutar: node scripts/migrarPlantillas.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PLANTILLAS_POR_CATEGORIA = {
  'MUJERES': {
    nombre: 'Plan Mujeres - 6 Días',
    objetivo: 'Tonificación y Fuerza',
    nivel: 'Intermedio',
    dias: [
      {
        numero_dia: 1,
        nombre_dia: 'Espalda y Bíceps',
        ejercicios: [
          { nombre: 'Dominadas', series: '4', repeticiones: '10', notas: 'Si no logras las 10, haz las que puedas o usa banda asistida' },
          { nombre: 'Halones Cerrados', series: '4', repeticiones: '15', notas: 'Agarre supino (palmas hacia ti)' },
          { nombre: 'Pullover', series: '3', repeticiones: '15', notas: 'Con mancuerna o barra' },
          { nombre: 'Remo con Mancuerna', series: '3', repeticiones: '12', notas: 'Cada brazo, apoyado en banco' },
          { nombre: 'Curl de Bíceps con Mancuerna', series: '3', repeticiones: '15', notas: 'Alternado o simultáneo' },
          { nombre: 'Curl Predicador', series: '3', repeticiones: '15', notas: 'En máquina o banco predicador' }
        ]
      },
      {
        numero_dia: 2,
        nombre_dia: 'Piernas (Cuádriceps y Glúteos)',
        ejercicios: [
          { nombre: 'Sentadilla en Haka', series: '2+2+1', repeticiones: '12+15+12', notas: 'Serie 1: 12 reps, Serie 2: 15 reps, Serie 3: 12 reps' },
          { nombre: 'Zancada', series: '4', repeticiones: '10', notas: '10 por pierna, alternadas o por serie' },
          { nombre: 'Sentadilla en Smith', series: '4', repeticiones: '10', notas: 'Posición de pies ligeramente adelantada' },
          { nombre: 'Sentadilla Sisi', series: '3', repeticiones: '20', notas: 'Enfoque en cuádriceps, talones elevados' },
          { nombre: 'Extensiones de Cuádriceps', series: '4', repeticiones: '15', notas: 'En máquina, última serie al fallo' }
        ]
      },
      {
        numero_dia: 3,
        nombre_dia: 'Pecho, Hombros y Tríceps',
        ejercicios: [
          { nombre: 'Aperturas con Mancuernas', series: '3', repeticiones: '15', notas: 'En banco plano o inclinado' },
          { nombre: 'Press con Mancuerna y Push Down', series: '4', repeticiones: '15', notas: 'Press de pecho seguido de push down de tríceps' },
          { nombre: 'Vuelos Laterales y Elevaciones Frontales', series: '2+2', repeticiones: '12+10', notas: 'Serie 1-2: Laterales 12 reps, Serie 3-4: Frontales 10 reps' },
          { nombre: 'Copa (Press Francés)', series: '3', repeticiones: '15', notas: 'Tras nuca con mancuerna o barra' },
          { nombre: 'Flexiones (Push Ups)', series: '4', repeticiones: '12', notas: 'Rodillas apoyadas si es necesario' }
        ]
      },
      {
        numero_dia: 4,
        nombre_dia: 'Piernas (Isquiotibiales y Glúteos)',
        ejercicios: [
          { nombre: 'Sentadilla Sumo', series: '3', repeticiones: '15', notas: 'Apertura amplia de piernas, trabaja interno y glúteo' },
          { nombre: 'Peso Muerto', series: '4', repeticiones: '15', notas: 'Convencional o rumano, espalda siempre recta' },
          { nombre: 'Leg Curl (Curl Femoral)', series: '3', repeticiones: '15', notas: 'Acostado o sentado en máquina' },
          { nombre: 'Peso Muerto Unilateral', series: '3', repeticiones: '12', notas: 'Con mancuerna, 12 reps por pierna' },
          { nombre: 'Aductor', series: '4', repeticiones: '20', notas: 'En máquina o con banda elástica' },
          { nombre: 'Elevación de Pantorrilla', series: '4', repeticiones: '20', notas: 'De pie o sentado' }
        ]
      },
      {
        numero_dia: 5,
        nombre_dia: 'Core y Flexibilidad',
        ejercicios: [
          { nombre: 'Estiramientos', series: '1', repeticiones: '10 min', notas: 'Pectoral, psoas ilíaco, lumbar y piramidal - Mantener 30 seg cada uno' },
          { nombre: 'Zig Zag (Mountain Climbers)', series: '3', repeticiones: '15', notas: 'Rodillas al pecho alternadas' },
          { nombre: 'Plancha Frontal', series: '4', repeticiones: '1 min', notas: 'Mantener cuerpo recto, abdomen contraído' },
          { nombre: 'Crunch Tocando Tobillos', series: '4', repeticiones: '20', notas: 'Acostado, tocar tobillos alternadamente' },
          { nombre: 'Planchas Laterales', series: '3', repeticiones: '30 seg', notas: '30 segundos por lado, apoyado en antebrazo' }
        ]
      },
      {
        numero_dia: 6,
        nombre_dia: 'Glúteo Enfocado',
        ejercicios: [
          { nombre: 'Sentadilla Búlgara', series: '2+2', repeticiones: '12+15', notas: 'Serie 1-2: 12 reps, Serie 3-4: 15 reps por pierna' },
          { nombre: 'Peso Muerto Unilateral para Glúteo', series: '3', repeticiones: '20', notas: '20 reps por pierna, enfoque en glúteo' },
          { nombre: 'Elevaciones Pélvicas (Hip Thrust)', series: '4', repeticiones: '12', notas: 'Con barra o mancuerna sobre cadera' },
          { nombre: 'Patada de Glúteo en Polea', series: '3', repeticiones: '15', notas: '15 reps por pierna' },
          { nombre: 'Abductor', series: '4', repeticiones: '20', notas: 'En máquina o con banda lateral' }
        ]
      }
    ]
  },
  'HOMBRES': {
    nombre: 'Plan Hombres - PPL',
    objetivo: 'Hipertrofia y Fuerza',
    nivel: 'Intermedio',
    dias: [
      {
        numero_dia: 1,
        nombre_dia: 'Pull (Espalda y Bíceps)',
        ejercicios: [
          { nombre: 'Dominadas', series: '4', repeticiones: '10', notas: 'Si no logras las 10, haz las que puedas' },
          { nombre: 'Jalón Agarre Cerrado', series: '4', repeticiones: '15', notas: '' },
          { nombre: 'Pullover', series: '3', repeticiones: '15', notas: '' },
          { nombre: 'Remo con Mancuerna', series: '3', repeticiones: '12', notas: '3 series por brazo' },
          { nombre: 'Curl de Bíceps con Mancuerna', series: '3', repeticiones: '15', notas: '' },
          { nombre: 'Curl Predicador', series: '3', repeticiones: '15', notas: '' }
        ]
      },
      {
        numero_dia: 2,
        nombre_dia: 'Push (Pecho, Hombros y Tríceps)',
        ejercicios: [
          { nombre: 'Press de Banca', series: '4', repeticiones: '8-10', notas: 'Técnica perfecta' },
          { nombre: 'Press Inclinado', series: '4', repeticiones: '10-12', notas: '' },
          { nombre: 'Aperturas con Mancuernas', series: '3', repeticiones: '12-15', notas: '' },
          { nombre: 'Press Militar', series: '4', repeticiones: '8-10', notas: '' },
          { nombre: 'Elevaciones Laterales', series: '3', repeticiones: '12-15', notas: '' },
          { nombre: 'Extensiones de Tríceps', series: '3', repeticiones: '12-15', notas: '' }
        ]
      },
      {
        numero_dia: 3,
        nombre_dia: 'Legs (Piernas)',
        ejercicios: [
          { nombre: 'Sentadilla', series: '4', repeticiones: '8-10', notas: 'Profundidad completa' },
          { nombre: 'Prensa', series: '4', repeticiones: '12-15', notas: '' },
          { nombre: 'Extensiones de Cuádriceps', series: '3', repeticiones: '15', notas: '' },
          { nombre: 'Curl Femoral', series: '3', repeticiones: '15', notas: '' },
          { nombre: 'Peso Muerto Rumano', series: '3', repeticiones: '10-12', notas: '' },
          { nombre: 'Elevación de Talones', series: '4', repeticiones: '20', notas: '' }
        ]
      }
    ]
  }
};

async function migrarPlantillas() {
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

    // Obtener ID del admin para creado_por
    const [admins] = await connection.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
    const adminId = admins.length > 0 ? admins[0].id : null;

    // Construir mapa de nombre -> id del catálogo
    const [catalogo] = await connection.query('SELECT id, nombre FROM catalogo_ejercicios');
    const catalogoMap = {};
    for (const ej of catalogo) {
      catalogoMap[ej.nombre] = ej.id;
    }

    let plantillasCreadas = 0;
    let ejerciciosNoEncontrados = [];

    for (const [categoria, config] of Object.entries(PLANTILLAS_POR_CATEGORIA)) {
      console.log(`\nProcesando categoría: ${categoria}`);

      await connection.beginTransaction();

      try {
        // Crear plantilla
        const [plantillaResult] = await connection.query(
          `INSERT INTO plantillas (nombre, categoria, objetivo, nivel, creado_por)
           VALUES (?, ?, ?, ?, ?)`,
          [config.nombre, categoria, config.objetivo, config.nivel, adminId]
        );
        const plantillaId = plantillaResult.insertId;

        for (const dia of config.dias) {
          const [diaResult] = await connection.query(
            `INSERT INTO plantilla_dias (plantilla_id, numero_dia, nombre_dia)
             VALUES (?, ?, ?)`,
            [plantillaId, dia.numero_dia, dia.nombre_dia]
          );
          const diaId = diaResult.insertId;

          for (let i = 0; i < dia.ejercicios.length; i++) {
            const ej = dia.ejercicios[i];
            const ejercicioId = catalogoMap[ej.nombre];

            if (!ejercicioId) {
              ejerciciosNoEncontrados.push(ej.nombre);
              console.warn(`  WARN: Ejercicio "${ej.nombre}" no encontrado en catálogo`);
              continue;
            }

            await connection.query(
              `INSERT INTO plantilla_dia_ejercicios (plantilla_dia_id, ejercicio_id, orden, series, repeticiones, notas)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [diaId, ejercicioId, i + 1, ej.series, ej.repeticiones, ej.notas || null]
            );
          }
        }

        await connection.commit();
        plantillasCreadas++;
        console.log(`  Plantilla "${config.nombre}" creada (ID: ${plantillaId})`);
      } catch (err) {
        await connection.rollback();
        throw err;
      }
    }

    console.log('\n════════════════════════════════════');
    console.log(`  Plantillas creadas: ${plantillasCreadas}`);
    if (ejerciciosNoEncontrados.length > 0) {
      console.log(`  Ejercicios no encontrados: ${ejerciciosNoEncontrados.length}`);
      ejerciciosNoEncontrados.forEach(n => console.log(`    - ${n}`));
    }
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

migrarPlantillas()
  .then(() => {
    console.log('Migración de plantillas completada');
    process.exit(0);
  })
  .catch(() => process.exit(1));
