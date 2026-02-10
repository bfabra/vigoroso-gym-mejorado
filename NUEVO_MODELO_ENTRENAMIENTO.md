# 📋 Nuevo Modelo de Planes de Entrenamiento

## 🎯 Objetivo

Permitir crear planes de entrenamiento detallados día por día, donde cada día puede tener múltiples ejercicios con series, repeticiones, pesos y notas específicas.

---

## 📊 Estructura del Modelo

```
Plan de Entrenamiento
├── Información General (nombre, objetivo, nivel, duración)
├── Día 1
│   ├── Ejercicio 1 (Dominadas: 4×10)
│   ├── Ejercicio 2 (Halones: 4×15)
│   └── Ejercicio N...
├── Día 2
│   ├── Ejercicio 1
│   └── Ejercicio N...
└── Día N...
```

---

## 🗄️ Tablas de Base de Datos

### 1. `planes_entrenamiento`
Información general del plan

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| participante_id | INT | A quién va dirigido |
| nombre | VARCHAR | "Rutina PPL", "Fuerza 5×5" |
| descripcion | TEXT | Descripción general |
| objetivo | VARCHAR | "Hipertrofia", "Fuerza", "Definición" |
| nivel | VARCHAR | "Principiante", "Intermedio", "Avanzado" |
| duracion_semanas | INT | Duración del plan |
| fecha_inicio | DATE | Cuándo empieza |
| fecha_fin | DATE | Cuándo termina |
| creado_por | INT | Qué entrenador lo creó |

### 2. `dias_entrenamiento`
Cada día del plan

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| plan_id | INT | A qué plan pertenece |
| numero_dia | INT | 1, 2, 3, etc. |
| nombre | VARCHAR | "Pull - Espalda y Bíceps" |
| descripcion | TEXT | Descripción del día |
| notas | TEXT | "Calienta bien", etc. |
| orden | INT | Orden de ejecución |

### 3. `ejercicios_dia`
Ejercicios de cada día

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| dia_id | INT | A qué día pertenece |
| nombre_ejercicio | VARCHAR | "Dominadas", "Press banca" |
| series | INT | 4, 3, 5, etc. |
| repeticiones | VARCHAR | "10", "8-12", "al fallo" |
| peso | VARCHAR | "60kg", "Progresivo" |
| descanso | VARCHAR | "60 seg", "90-120 seg" |
| notas | TEXT | Instrucciones específicas |
| video_url | VARCHAR | Link a video (opcional) |
| orden | INT | Orden en el día |

### 4. `registros_entrenamiento`
Cuando el participante completa un ejercicio

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT | ID único |
| participante_id | INT | Quién lo hizo |
| ejercicio_dia_id | INT | Qué ejercicio |
| fecha | DATE | Cuándo lo hizo |
| series_completadas | INT | Cuántas series hizo |
| repeticiones_reales | VARCHAR | "10,10,9,8" por serie |
| peso_utilizado | VARCHAR | Peso usado |
| dificultad | ENUM | Fácil, Moderado, Difícil |
| notas | TEXT | Observaciones |

---

## 🚀 Instalación

### 1. Aplicar el nuevo esquema

```bash
mysql -u root -p vigoroso_gym < backend/scripts/nuevo_modelo_entrenamiento.sql
```

Esto creará:
- ✅ Las 4 tablas nuevas
- ✅ Índices para performance
- ✅ Una vista útil
- ✅ Un plan de ejemplo (3 días con ejercicios)

### 2. Actualizar el server.js

Cambia la ruta de entrenamiento en `server.js`:

```javascript
// Opción A: Reemplazar completamente
const entrenamientoRoutes = require('./routes/entrenamientoNuevo');

// Opción B: Mantener ambas (para transición)
const entrenamientoRoutesOld = require('./routes/entrenamiento');
const entrenamientoRoutesNew = require('./routes/entrenamientoNuevo');
app.use('/api/entrenamiento/old', entrenamientoRoutesOld);
app.use('/api/entrenamiento', entrenamientoRoutesNew);
```

---

## 📡 Endpoints de la API

### Planes

#### GET `/api/entrenamiento/planes/participante/:participante_id`
Obtener todos los planes de un participante

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Rutina PPL",
    "objetivo": "Hipertrofia",
    "nivel": "Intermedio",
    "total_dias": 3,
    "total_ejercicios": 18
  }
]
```

#### GET `/api/entrenamiento/plan/:plan_id`
Obtener plan completo con días y ejercicios

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Rutina PPL",
  "objetivo": "Hipertrofia",
  "participante_nombre": "Juan Pérez",
  "dias": [
    {
      "id": 1,
      "numero_dia": 1,
      "nombre": "Pull - Espalda y Bíceps",
      "notas": "Calienta bien antes de dominadas",
      "ejercicios": [
        {
          "id": 1,
          "nombre_ejercicio": "Dominadas",
          "series": 4,
          "repeticiones": "10",
          "peso": "Peso corporal",
          "descanso": "90 seg",
          "notas": "Si no logras las 10, haz las que puedas",
          "orden": 1
        }
      ]
    }
  ]
}
```

#### POST `/api/entrenamiento/plan`
Crear plan completo

**Body:**
```json
{
  "participante_id": 1,
  "nombre": "Rutina Full Body",
  "descripcion": "3 días a la semana",
  "objetivo": "Fuerza",
  "nivel": "Principiante",
  "duracion_semanas": 8,
  "fecha_inicio": "2024-02-01",
  "dias": [
    {
      "numero_dia": 1,
      "nombre": "Día 1 - Full Body",
      "descripcion": "Tren superior e inferior",
      "notas": "Descansar 48h antes del próximo",
      "ejercicios": [
        {
          "nombre_ejercicio": "Sentadilla",
          "series": 3,
          "repeticiones": "10",
          "peso": "60kg",
          "descanso": "120 seg",
          "notas": "Profundidad completa",
          "orden": 1
        },
        {
          "nombre_ejercicio": "Press banca",
          "series": 3,
          "repeticiones": "10",
          "peso": "50kg",
          "descanso": "90 seg",
          "orden": 2
        }
      ]
    }
  ]
}
```

### Registros

#### POST `/api/entrenamiento/registro`
Registrar ejecución de ejercicio

**Body:**
```json
{
  "participante_id": 1,
  "ejercicio_dia_id": 5,
  "fecha": "2024-02-05",
  "series_completadas": 4,
  "repeticiones_reales": "10,10,9,8",
  "peso_utilizado": "Peso corporal",
  "dificultad": "Moderado",
  "notas": "La última serie costó más"
}
```

#### GET `/api/entrenamiento/progreso/:participante_id/:plan_id`
Ver progreso en un plan

**Respuesta:**
```json
[
  {
    "numero_dia": 1,
    "dia_nombre": "Pull - Espalda y Bíceps",
    "nombre_ejercicio": "Dominadas",
    "series_planificadas": 4,
    "reps_planificadas": "10",
    "veces_realizado": 8,
    "promedio_series": 3.75,
    "ultima_vez": "2024-02-10"
  }
]
```

---

## 💡 Ejemplos de Uso

### Crear un plan de 3 días (PPL)

```javascript
const nuevoPlan = {
  participante_id: 1,
  nombre: "PPL Hipertrofia",
  objetivo: "Hipertrofia",
  nivel: "Intermedio",
  duracion_semanas: 8,
  fecha_inicio: "2024-02-01",
  dias: [
    {
      numero_dia: 1,
      nombre: "Push - Pecho y Hombros",
      ejercicios: [
        {
          nombre_ejercicio: "Press banca",
          series: 4,
          repeticiones: "8-10",
          peso: "Progresivo",
          descanso: "90 seg",
          notas: "Aumentar peso cada semana",
          orden: 1
        },
        {
          nombre_ejercicio: "Press inclinado",
          series: 3,
          repeticiones: "12",
          peso: "Moderado",
          descanso: "60 seg",
          orden: 2
        }
      ]
    },
    {
      numero_dia: 2,
      nombre: "Pull - Espalda",
      ejercicios: [
        {
          nombre_ejercicio: "Dominadas",
          series: 4,
          repeticiones: "al fallo",
          peso: "Peso corporal",
          descanso: "90 seg",
          orden: 1
        }
      ]
    },
    {
      numero_dia: 3,
      nombre: "Legs - Pierna",
      ejercicios: [
        {
          nombre_ejercicio: "Sentadilla",
          series: 5,
          repeticiones: "5",
          peso: "Pesado",
          descanso: "180 seg",
          notas: "Programa de fuerza 5x5",
          orden: 1
        }
      ]
    }
  ]
};

const response = await fetch('/api/entrenamiento/plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(nuevoPlan)
});
```

---

## 🔄 Migración desde el modelo anterior

Si ya tienes datos en el modelo antiguo, aquí un script de migración:

```sql
-- Migrar planes antiguos al nuevo modelo
-- (Ejecutar con precaución, revisar primero)

-- Este script es solo un ejemplo, ajustar según tus necesidades
INSERT INTO planes_entrenamiento (participante_id, nombre, descripcion, creado_por, fecha_inicio)
SELECT 
  participante_id,
  CONCAT('Plan ', mes_año) as nombre,
  objetivo,
  1, -- ID del usuario que creó (ajustar)
  STR_TO_DATE(CONCAT(mes_año, '-01'), '%Y-%m-%d')
FROM planes_entrenamiento_old
WHERE activo = TRUE;
```

---

## 🎨 Componente Frontend (Ejemplo)

```javascript
function PlanViewer({ planId }) {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetch(`/api/entrenamiento/plan/${planId}`)
      .then(res => res.json())
      .then(data => setPlan(data));
  }, [planId]);

  if (!plan) return <div>Cargando...</div>;

  return (
    <div className="plan-container">
      <h1>{plan.nombre}</h1>
      <p>{plan.objetivo} - {plan.nivel}</p>
      
      {plan.dias.map(dia => (
        <div key={dia.id} className="dia-card">
          <h2>Día {dia.numero_dia}: {dia.nombre}</h2>
          {dia.notas && <p className="notas">{dia.notas}</p>}
          
          <div className="ejercicios">
            {dia.ejercicios.map((ej, idx) => (
              <div key={ej.id} className="ejercicio">
                <span className="numero">{idx + 1}.</span>
                <strong>{ej.nombre_ejercicio}:</strong>
                {ej.series}×{ej.repeticiones}
                {ej.peso && <span> - {ej.peso}</span>}
                {ej.notas && <p className="notas-ej">{ej.notas}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Ventajas del Nuevo Modelo

1. **Flexibilidad total**: Crea planes con cualquier cantidad de días y ejercicios
2. **Instrucciones detalladas**: Cada ejercicio puede tener notas específicas
3. **Seguimiento preciso**: Registra cada sesión con detalles
4. **Progreso visible**: Ve la evolución en cada ejercicio
5. **Escalable**: Fácil agregar nuevos campos (tempo, RIR, etc.)

---

## 📝 Próximas mejoras sugeridas

- [ ] Copiar/duplicar planes existentes
- [ ] Plantillas de planes predefinidos
- [ ] Superset y circuitos
- [ ] Calculadora de 1RM
- [ ] Gráficas de progreso
- [ ] Exportar plan a PDF
- [ ] App móvil para registrar en el gym

---

## 🐛 Solución de Problemas

**Error: "Cannot add foreign key constraint"**
- Asegúrate de ejecutar el script en una BD limpia o borra las tablas antiguas primero

**Los datos no aparecen**
- Verifica que `activo = TRUE` en todas las tablas
- Revisa que los IDs de participante y usuario existen

**Rendimiento lento**
- Los índices están creados automáticamente
- Para muchos registros, considera paginación

---

¡Listo para crear planes de entrenamiento profesionales! 💪🏋️
