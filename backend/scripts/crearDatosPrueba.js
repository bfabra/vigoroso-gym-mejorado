const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function crearDatosPrueba() {
  const connection = await pool.getConnection();

  try {
    console.log('🔧 Creando datos de prueba...\n');

    await connection.beginTransaction();

    // Crear entrenador de prueba
    const hashedPasswordTrainer = await bcrypt.hash('trainer123', 10);
    const [trainerResult] = await connection.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      ['Juan Pérez Entrenador', 'trainer@fabra.com', hashedPasswordTrainer, 'entrenador']
    );
    const trainerId = trainerResult.insertId;
    console.log('✅ Entrenador creado: trainer@fabra.com / trainer123');

    // Crear participantes de prueba
    const participantes = [
      {
        nombre: 'Carlos Rodríguez',
        email: 'carlos@example.com',
        password: 'carlos123',
        telefono: '3001234567',
        fecha_nacimiento: '1995-05-15',
        genero: 'M'
      },
      {
        nombre: 'María González',
        email: 'maria@example.com',
        password: 'maria123',
        telefono: '3002345678',
        fecha_nacimiento: '1992-08-22',
        genero: 'F'
      },
      {
        nombre: 'Pedro Martínez',
        email: 'pedro@example.com',
        password: 'pedro123',
        telefono: '3003456789',
        fecha_nacimiento: '1998-03-10',
        genero: 'M'
      }
    ];

    const participantesIds = [];

    for (const p of participantes) {
      const hashedPassword = await bcrypt.hash(p.password, 10);
      const [result] = await connection.query(
        `INSERT INTO participantes 
         (nombre, email, password, telefono, fecha_nacimiento, genero, usuario_creador_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.nombre, p.email, hashedPassword, p.telefono, p.fecha_nacimiento, p.genero, trainerId]
      );
      participantesIds.push(result.insertId);
      console.log(`✅ Participante creado: ${p.email} / ${p.password}`);
    }

    // Crear plan de entrenamiento para el primer participante
    const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [planResult] = await connection.query(
      'INSERT INTO planes_entrenamiento (participante_id, mes_año, creado_por) VALUES (?, ?, ?)',
      [participantesIds[0], mesActual, trainerId]
    );
    const planId = planResult.insertId;

    // Ejercicios de ejemplo para cada día
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const ejerciciosPorDia = {
      'Lunes': [
        { nombre: 'Press de Banca', series: '4', reps: '8-10', notas: 'Técnica perfecta' },
        { nombre: 'Press Inclinado con Mancuernas', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Aperturas con Mancuernas', series: '3', reps: '12-15', notas: 'Control en negativa' },
        { nombre: 'Fondos en Paralelas', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Tríceps en Polea', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Extensiones sobre Cabeza', series: '3', reps: '12-15', notas: '' }
      ],
      'Martes': [
        { nombre: 'Sentadilla', series: '4', reps: '8-10', notas: 'Profundidad completa' },
        { nombre: 'Prensa de Piernas', series: '4', reps: '10-12', notas: '' },
        { nombre: 'Peso Muerto Rumano', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Curl Femoral', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Extensiones de Cuádriceps', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Pantorrillas de Pie', series: '4', reps: '15-20', notas: 'Rango completo' }
      ],
      'Miércoles': [
        { nombre: 'Dominadas', series: '4', reps: '8-10', notas: 'Puede usar banda si es necesario' },
        { nombre: 'Remo con Barra', series: '4', reps: '8-10', notas: 'Mantener espalda recta' },
        { nombre: 'Remo con Mancuernas', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Jalón al Pecho', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Curl de Bíceps con Barra', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Curl Martillo', series: '3', reps: '12-15', notas: '' }
      ],
      'Jueves': [
        { nombre: 'Press Militar', series: '4', reps: '8-10', notas: 'Núcleo firme' },
        { nombre: 'Elevaciones Laterales', series: '3', reps: '12-15', notas: 'Control del movimiento' },
        { nombre: 'Elevaciones Frontales', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Pájaros', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Encogimientos con Barra', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Abdominales en Polea', series: '3', reps: '15-20', notas: '' }
      ],
      'Viernes': [
        { nombre: 'Peso Muerto', series: '4', reps: '6-8', notas: 'Técnica impecable' },
        { nombre: 'Zancadas con Mancuernas', series: '3', reps: '10-12', notas: 'Por pierna' },
        { nombre: 'Prensa Unilateral', series: '3', reps: '10-12', notas: 'Por pierna' },
        { nombre: 'Buenos Días', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Curl Femoral Acostado', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Pantorrillas Sentado', series: '4', reps: '15-20', notas: '' }
      ],
      'Sábado': [
        { nombre: 'Press Banca Inclinado', series: '4', reps: '8-10', notas: '' },
        { nombre: 'Fondos en Máquina', series: '3', reps: '10-12', notas: '' },
        { nombre: 'Cruces en Polea Alta', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Tríceps con Cuerda', series: '3', reps: '12-15', notas: '' },
        { nombre: 'Dominadas Supinas', series: '3', reps: '8-10', notas: '' },
        { nombre: 'Curl Concentrado', series: '3', reps: '12-15', notas: '' }
      ]
    };

    for (let i = 0; i < diasSemana.length; i++) {
      const dia = diasSemana[i];
      const ejercicios = ejerciciosPorDia[dia];
      
      for (let j = 0; j < ejercicios.length; j++) {
        const ej = ejercicios[j];
        await connection.query(
          `INSERT INTO ejercicios_plan 
           (plan_id, dia_semana, orden, nombre_ejercicio, series, repeticiones, notas) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [planId, dia, j + 1, ej.nombre, ej.series, ej.reps, ej.notas]
        );
      }
    }
    console.log(`✅ Plan de entrenamiento creado para ${participantes[0].nombre}`);

    // Crear plan de nutrición para el primer participante
    const [planNutricionResult] = await connection.query(
      `INSERT INTO planes_nutricion 
       (participante_id, creado_por, recomendaciones_generales, activo) 
       VALUES (?, ?, ?, TRUE)`,
      [
        participantesIds[0],
        trainerId,
        'Beber mínimo 3 litros de agua al día. Suplementar con proteína whey post-entrenamiento. Evitar alimentos procesados y azúcares refinados.'
      ]
    );
    const planNutricionId = planNutricionResult.insertId;

    // Comidas del plan
    const comidas = [
      {
        tipo: 'Desayuno',
        opcion1: '4 huevos revueltos, 1 taza de avena, 1 plátano, café negro',
        opcion2: 'Batido proteico (30g proteína, 1 taza avena, 1 cucharada mantequilla de maní, leche de almendras)'
      },
      {
        tipo: 'Media Mañana',
        opcion1: '200g pechuga de pollo, 1 taza arroz integral, vegetales',
        opcion2: 'Atún (1 lata), 2 rebanadas pan integral, aguacate'
      },
      {
        tipo: 'Almuerzo',
        opcion1: '250g carne magra, 2 tazas arroz, ensalada grande, aceite de oliva',
        opcion2: '250g salmón, batata mediana, brócoli al vapor'
      },
      {
        tipo: 'Merienda',
        opcion1: 'Batido post-entreno (40g proteína, 1 plátano, creatina)',
        opcion2: '200g yogurt griego, granola, frutas del bosque'
      },
      {
        tipo: 'Cena',
        opcion1: '200g pechuga de pollo, quinoa, vegetales salteados',
        opcion2: '200g pescado blanco, ensalada grande, aceite de oliva, 1 papa pequeña'
      }
    ];

    for (const comida of comidas) {
      await connection.query(
        `INSERT INTO comidas_plan 
         (plan_nutricion_id, tipo_comida, opcion_1, opcion_2) 
         VALUES (?, ?, ?, ?)`,
        [planNutricionId, comida.tipo, comida.opcion1, comida.opcion2]
      );
    }
    console.log(`✅ Plan de nutrición creado para ${participantes[0].nombre}`);

    // Crear algunos registros de entrenamiento de ejemplo
    const [ejercicios] = await connection.query(
      'SELECT id FROM ejercicios_plan WHERE plan_id = ? LIMIT 10',
      [planId]
    );

    const fechaHoy = new Date().toISOString().split('T')[0];
    const fechaAyer = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (let i = 0; i < Math.min(5, ejercicios.length); i++) {
      await connection.query(
        `INSERT INTO registros_entrenamiento 
         (participante_id, ejercicio_plan_id, fecha_registro, peso_utilizado, series_completadas, repeticiones_completadas)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [participantesIds[0], ejercicios[i].id, fechaAyer, 40 + (i * 5), 4, 10]
      );
    }
    console.log(`✅ Registros de entrenamiento creados`);

    await connection.commit();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✅ Datos de prueba creados            ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n📋 Resumen de Credenciales:\n');
    console.log('Entrenador:');
    console.log('  Email: trainer@fabra.com');
    console.log('  Password: trainer123\n');
    console.log('Participantes:');
    participantes.forEach(p => {
      console.log(`  ${p.nombre}: ${p.email} / ${p.password}`);
    });
    console.log('');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Ejecutar
crearDatosPrueba()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch(() => {
    console.error('❌ Proceso falló');
    process.exit(1);
  });
