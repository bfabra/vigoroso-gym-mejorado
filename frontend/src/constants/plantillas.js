// ==================== CALENTAMIENTO DIARIO ====================
// Este calentamiento debe realizarse TODOS los días antes del entrenamiento
export const CALENTAMIENTO_DIARIO = [
  { nombre: 'Cardio', series: '1', reps: '10 min', notas: 'Trotar, bicicleta, elíptica o saltar cuerda' },
  { nombre: 'Movilidad Articular', series: '1', reps: '5-10 min', notas: 'Rotar cuello, hombros, codos, muñecas, caderas, rodillas y tobillos' }
];

// ==================== PLANTILLAS POR CATEGORÍA ====================

export const PLANTILLAS_POR_CATEGORIA = {
  // =============== MUJERES - Plan de 6 Días ===============
  'MUJERES': {
    'Día 1 - Espalda y Bíceps': [
      { nombre: 'Dominadas', series: '4', reps: '10', notas: 'Si no logras las 10, haz las que puedas o usa banda asistida' },
      { nombre: 'Halones Cerrados', series: '4', reps: '15', notas: 'Agarre supino (palmas hacia ti)' },
      { nombre: 'Pullover', series: '3', reps: '15', notas: 'Con mancuerna o barra' },
      { nombre: 'Remo con Mancuerna', series: '3', reps: '12', notas: 'Cada brazo, apoyado en banco' },
      { nombre: 'Curl de Bíceps con Mancuerna', series: '3', reps: '15', notas: 'Alternado o simultáneo' },
      { nombre: 'Curl Predicador', series: '3', reps: '15', notas: 'En máquina o banco predicador' }
    ],

    'Día 2 - Piernas (Cuádriceps y Glúteos)': [
      { nombre: 'Sentadilla en Haka', series: '2+2+1', reps: '12+15+12', notas: 'Serie 1: 12 reps, Serie 2: 15 reps, Serie 3: 12 reps' },
      { nombre: 'Zancada', series: '4', reps: '10', notas: '10 por pierna, alternadas o por serie' },
      { nombre: 'Sentadilla en Smith', series: '4', reps: '10', notas: 'Posición de pies ligeramente adelantada' },
      { nombre: 'Sentadilla Sisi', series: '3', reps: '20', notas: 'Enfoque en cuádriceps, talones elevados' },
      { nombre: 'Extensiones de Cuádriceps', series: '4', reps: '15', notas: 'En máquina, última serie al fallo' }
    ],

    'Día 3 - Pecho, Hombros y Tríceps': [
      { nombre: 'Aperturas con Mancuernas', series: '3', reps: '15', notas: 'En banco plano o inclinado' },
      { nombre: 'Press con Mancuerna y Push Down', series: '4', reps: '15', notas: 'Press de pecho seguido de push down de tríceps' },
      { nombre: 'Vuelos Laterales y Elevaciones Frontales', series: '2+2', reps: '12+10', notas: 'Serie 1-2: Laterales 12 reps, Serie 3-4: Frontales 10 reps' },
      { nombre: 'Copa (Press Francés)', series: '3', reps: '15', notas: 'Tras nuca con mancuerna o barra' },
      { nombre: 'Flexiones (Push Ups)', series: '4', reps: '12', notas: 'Rodillas apoyadas si es necesario' }
    ],

    'Día 4 - Piernas (Isquiotibiales y Glúteos)': [
      { nombre: 'Sentadilla Sumo', series: '3', reps: '15', notas: 'Apertura amplia de piernas, trabaja interno y glúteo' },
      { nombre: 'Peso Muerto', series: '4', reps: '15', notas: 'Convencional o rumano, espalda siempre recta' },
      { nombre: 'Leg Curl (Curl Femoral)', series: '3', reps: '15', notas: 'Acostado o sentado en máquina' },
      { nombre: 'Peso Muerto Unilateral', series: '3', reps: '12', notas: 'Con mancuerna, 12 reps por pierna' },
      { nombre: 'Aductor', series: '4', reps: '20', notas: 'En máquina o con banda elástica' },
      { nombre: 'Elevación de Pantorrilla', series: '4', reps: '20', notas: 'De pie o sentado' }
    ],

    'Día 5 - Core y Flexibilidad': [
      { nombre: 'Estiramientos', series: '1', reps: '10 min', notas: 'Pectoral, psoas ilíaco, lumbar y piramidal - Mantener 30 seg cada uno' },
      { nombre: 'Zig Zag (Mountain Climbers)', series: '3', reps: '15', notas: 'Rodillas al pecho alternadas' },
      { nombre: 'Plancha Frontal', series: '4', reps: '1 min', notas: 'Mantener cuerpo recto, abdomen contraído' },
      { nombre: 'Crunch Tocando Tobillos', series: '4', reps: '20', notas: 'Acostado, tocar tobillos alternadamente' },
      { nombre: 'Planchas Laterales', series: '3', reps: '30 seg', notas: '30 segundos por lado, apoyado en antebrazo' }
    ],

    'Día 6 - Glúteo Enfocado': [
      { nombre: 'Sentadilla Búlgara', series: '2+2', reps: '12+15', notas: 'Serie 1-2: 12 reps, Serie 3-4: 15 reps por pierna' },
      { nombre: 'Peso Muerto Unilateral para Glúteo', series: '3', reps: '20', notas: '20 reps por pierna, enfoque en glúteo' },
      { nombre: 'Elevaciones Pélvicas (Hip Thrust)', series: '4', reps: '12', notas: 'Con barra o mancuerna sobre cadera' },
      { nombre: 'Patada de Glúteo en Polea', series: '3', reps: '15', notas: '15 reps por pierna' },
      { nombre: 'Abductor', series: '4', reps: '20', notas: 'En máquina o con banda lateral' }
    ]
  },

  // =============== HOMBRES - Plan de 6 Días (Futuro) ===============
  'HOMBRES': {
    'PPL - Pull (Espalda y Bíceps)': [
      { nombre: 'Dominadas', series: '4', reps: '10', notas: 'Si no logras las 10, haz las que puedas' },
      { nombre: 'Jalón Agarre Cerrado', series: '4', reps: '15', notas: '' },
      { nombre: 'Pullover', series: '3', reps: '15', notas: '' },
      { nombre: 'Remo con Mancuerna', series: '3', reps: '12', notas: '3 series por brazo' },
      { nombre: 'Curl de Bíceps con Mancuerna', series: '3', reps: '15', notas: '' },
      { nombre: 'Curl Predicador', series: '3', reps: '15', notas: '' }
    ],
    'PPL - Push (Pecho, Hombros y Tríceps)': [
      { nombre: 'Press de Banca', series: '4', reps: '8-10', notas: 'Técnica perfecta' },
      { nombre: 'Press Inclinado', series: '4', reps: '10-12', notas: '' },
      { nombre: 'Aperturas con Mancuernas', series: '3', reps: '12-15', notas: '' },
      { nombre: 'Press Militar', series: '4', reps: '8-10', notas: '' },
      { nombre: 'Elevaciones Laterales', series: '3', reps: '12-15', notas: '' },
      { nombre: 'Extensiones de Tríceps', series: '3', reps: '12-15', notas: '' }
    ],
    'PPL - Legs (Piernas)': [
      { nombre: 'Sentadilla', series: '4', reps: '8-10', notas: 'Profundidad completa' },
      { nombre: 'Prensa', series: '4', reps: '12-15', notas: '' },
      { nombre: 'Extensiones de Cuádriceps', series: '3', reps: '15', notas: '' },
      { nombre: 'Curl Femoral', series: '3', reps: '15', notas: '' },
      { nombre: 'Peso Muerto Rumano', series: '3', reps: '10-12', notas: '' },
      { nombre: 'Elevación de Talones', series: '4', reps: '20', notas: '' }
    ]
  },

  // =============== NIÑOS - Programa Adaptado (Futuro) ===============
  'NIÑOS': {
    'Día 1 - Juegos y Fuerza': [
      { nombre: 'Nota', series: '1', reps: '1', notas: '⚠️ PRÓXIMAMENTE: Programa especializado para niños con ejercicios lúdicos y seguros' }
    ]
  },

  // =============== ADULTO MAYOR - Programa Adaptado (Futuro) ===============
  'ADULTO MAYOR': {
    'Día 1 - Movilidad y Fuerza Funcional': [
      { nombre: 'Nota', series: '1', reps: '1', notas: '⚠️ PRÓXIMAMENTE: Programa especializado para adultos mayores enfocado en movilidad y prevención' }
    ]
  }
};

// ==================== COMPATIBILIDAD CON CÓDIGO EXISTENTE ====================
// Exportar plantillas de MUJERES como PLANTILLAS_RUTINA principal
export const PLANTILLAS_RUTINA = {
  ...PLANTILLAS_POR_CATEGORIA['MUJERES'],
  ...PLANTILLAS_POR_CATEGORIA['HOMBRES'] // Incluir también las de hombres
};

// ==================== DÍAS DE LA SEMANA ====================
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ==================== TIPOS DE COMIDAS ====================
export const TIPOS_COMIDA = ['Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena'];

// ==================== CATEGORÍAS DE PLANTILLAS ====================
export const CATEGORIAS_PLANTILLAS = ['MUJERES', 'HOMBRES', 'NIÑOS', 'ADULTO MAYOR'];
