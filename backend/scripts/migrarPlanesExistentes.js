/**
 * Script de migración: Convertir planes existentes (legacy) a asignaciones con snapshots
 * Requiere que migrarCatalogo.js y migrarPlantillas.js se hayan ejecutado primero.
 *
 * Ejecutar: node scripts/migrarPlanesExistentes.js
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const DIA_SEMANA_TO_NUMERO = {
  'Lunes': 1,
  'Martes': 2,
  'Miércoles': 3,
  'Miercoles': 3,
  'Jueves': 4,
  'Viernes': 5,
  'Sábado': 6,
  'Sabado': 6
};

const NUMERO_TO_DIA_SEMANA = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miercoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sabado'
};

async function migrarPlanesExistentes() {
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

    // Obtener ID del admin
    const [admins] = await connection.query("SELECT id FROM usuarios WHERE rol = 'admin' LIMIT 1");
    const adminId = admins.length > 0 ? admins[0].id : null;

    // Crear plantilla "Legacy" para asociar asignaciones migradas
    let legacyPlantillaId;
    const [existingLegacy] = await connection.query(
      "SELECT id FROM plantillas WHERE nombre = 'Plan Legacy (Migrado)'"
    );

    if (existingLegacy.length > 0) {
      legacyPlantillaId = existingLegacy[0].id;
    } else {
      const [legacyResult] = await connection.query(
        `INSERT INTO plantillas (nombre, categoria, descripcion, creado_por)
         VALUES ('Plan Legacy (Migrado)', 'MUJERES', 'Plantilla creada automáticamente durante la migración', ?)`,
        [adminId]
      );
      legacyPlantillaId = legacyResult.insertId;
    }

    // Mapa nombre -> id del catálogo
    const [catalogo] = await connection.query('SELECT id, nombre FROM catalogo_ejercicios');
    const catalogoMap = {};
    for (const ej of catalogo) {
      catalogoMap[ej.nombre] = ej.id;
    }

    // Obtener todos los planes legacy
    const [planes] = await connection.query(
      'SELECT * FROM planes_entrenamiento ORDER BY participante_id, mes_año'
    );

    let migrados = 0;
    let omitidos = 0;
    let registrosMigrados = 0;

    for (const plan of planes) {
      // Verificar si ya se migró
      const [yaExiste] = await connection.query(
        `SELECT id FROM asignaciones_plan
         WHERE participante_id = ? AND mes_anio = ?`,
        [plan.participante_id, plan['mes_año']]
      );

      if (yaExiste.length > 0) {
        omitidos++;
        continue;
      }

      await connection.beginTransaction();

      try {
        // Crear asignación
        const [asignacionResult] = await connection.query(
          `INSERT INTO asignaciones_plan (participante_id, plantilla_id, mes_anio, notas_entrenador, asignado_por)
           VALUES (?, ?, ?, ?, ?)`,
          [plan.participante_id, legacyPlantillaId, plan['mes_año'], plan.notas, plan.creado_por || adminId]
        );
        const asignacionId = asignacionResult.insertId;

        // Obtener ejercicios del plan legacy
        const [ejercicios] = await connection.query(
          `SELECT * FROM ejercicios_plan WHERE plan_id = ?
           ORDER BY FIELD(dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'), orden`,
          [plan.id]
        );

        // Agrupar por día
        const diasMap = {};
        for (const ej of ejercicios) {
          if (!diasMap[ej.dia_semana]) {
            diasMap[ej.dia_semana] = [];
          }
          diasMap[ej.dia_semana].push(ej);
        }

        // Mapeo de ejercicio_plan_id viejo -> snapshot_ejercicio_id nuevo (para registros)
        const idMap = {};

        for (const [diaSemana, ejsDia] of Object.entries(diasMap)) {
          const numeroDia = DIA_SEMANA_TO_NUMERO[diaSemana] || 1;
          const diaSemanaEnum = NUMERO_TO_DIA_SEMANA[numeroDia];

          const [snapshotDiaResult] = await connection.query(
            `INSERT INTO plan_snapshot_dias (asignacion_id, numero_dia, nombre_dia, dia_semana)
             VALUES (?, ?, ?, ?)`,
            [asignacionId, numeroDia, diaSemana, diaSemanaEnum]
          );
          const snapshotDiaId = snapshotDiaResult.insertId;

          for (const ej of ejsDia) {
            const catalogoId = catalogoMap[ej.nombre_ejercicio] || null;

            // Parsear imágenes del JSON legacy
            let imagen1 = null, imagen2 = null, imagen3 = null;
            if (ej.imagenes_url) {
              try {
                const imgs = JSON.parse(ej.imagenes_url);
                if (Array.isArray(imgs)) {
                  imagen1 = imgs[0] || null;
                  imagen2 = imgs[1] || null;
                  imagen3 = imgs[2] || null;
                }
              } catch (e) { /* ignorar JSON inválido */ }
            }

            const [snapshotEjResult] = await connection.query(
              `INSERT INTO plan_snapshot_ejercicios
               (snapshot_dia_id, ejercicio_catalogo_id, orden, nombre_ejercicio, series, repeticiones, notas,
                imagen_1_url, imagen_2_url, imagen_3_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [snapshotDiaId, catalogoId, ej.orden, ej.nombre_ejercicio, ej.series, ej.repeticiones, ej.notas,
               imagen1, imagen2, imagen3]
            );

            idMap[ej.id] = snapshotEjResult.insertId;
          }
        }

        // Migrar registros de entrenamiento
        const [registros] = await connection.query(
          'SELECT * FROM registros_entrenamiento WHERE participante_id = ?',
          [plan.participante_id]
        );

        for (const reg of registros) {
          const newSnapshotId = idMap[reg.ejercicio_plan_id];
          if (newSnapshotId) {
            await connection.query(
              `INSERT INTO registros_entrenamiento_v2
               (participante_id, snapshot_ejercicio_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas, comentarios, fecha_hora_registro)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [reg.participante_id, newSnapshotId, reg.fecha_registro, reg.peso_utilizado, reg.series_completadas, reg.repeticiones_completadas, reg.comentarios, reg.fecha_hora_registro]
            );
            registrosMigrados++;
          }
        }

        await connection.commit();
        migrados++;
        console.log(`  Migrado: Participante ${plan.participante_id}, Mes ${plan['mes_año']} (${Object.keys(diasMap).length} días, ${ejercicios.length} ejercicios)`);
      } catch (err) {
        await connection.rollback();
        console.error(`  ERROR migrando plan ${plan.id}:`, err.message);
      }
    }

    console.log('\n════════════════════════════════════');
    console.log(`  Planes migrados: ${migrados}`);
    console.log(`  Planes omitidos (ya migrados): ${omitidos}`);
    console.log(`  Registros de entrenamiento migrados: ${registrosMigrados}`);
    console.log('════════════════════════════════════\n');

  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

migrarPlanesExistentes()
  .then(() => {
    console.log('Migración de planes existentes completada');
    process.exit(0);
  })
  .catch(() => process.exit(1));
