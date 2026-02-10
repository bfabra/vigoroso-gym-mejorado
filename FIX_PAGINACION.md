# 🔧 Fix: Error de Paginación en Frontend

## Problema
```
ERROR: participantes.reduce is not a function
```

## Causa
El backend ahora retorna la lista de participantes en un formato paginado:

```json
{
  "data": [...],  // El array de participantes
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Antes retornaba directamente el array: `[...]`

## Solución Implementada

**Archivo:** `frontend/src/App.js`

**Antes:**
```javascript
const loadParticipantes = async () => {
  try {
    const data = await participantesService.obtenerTodos();
    setParticipantes(data);  // ❌ Guardaba todo el objeto
  } catch (error) {
    console.error('Error cargando participantes:', error);
  }
};
```

**Después:**
```javascript
const loadParticipantes = async () => {
  try {
    const response = await participantesService.obtenerTodos();
    // El backend ahora retorna { data: [...], pagination: {...} }
    setParticipantes(response.data || response);  // ✅ Extrae solo el array
  } catch (error) {
    console.error('Error cargando participantes:', error);
  }
};
```

## Compatibilidad
El código `response.data || response` es compatible tanto con:
- Respuesta nueva (con paginación): usa `response.data`
- Respuesta antigua (array directo): usa `response` como fallback

## Próximos Pasos (Opcional)

Si quieres usar la información de paginación en el frontend, puedes hacer:

```javascript
const [participantes, setParticipantes] = useState([]);
const [pagination, setPagination] = useState(null);

const loadParticipantes = async (page = 1) => {
  try {
    const response = await participantesService.obtenerTodos();
    setParticipantes(response.data || response);
    setPagination(response.pagination);
  } catch (error) {
    console.error('Error cargando participantes:', error);
  }
};

// Luego en el JSX puedes agregar botones de paginación:
{pagination && (
  <div className="pagination">
    <button 
      disabled={!pagination.hasPrevPage}
      onClick={() => loadParticipantes(pagination.page - 1)}
    >
      Anterior
    </button>
    <span>Página {pagination.page} de {pagination.totalPages}</span>
    <button 
      disabled={!pagination.hasNextPage}
      onClick={() => loadParticipantes(pagination.page + 1)}
    >
      Siguiente
    </button>
  </div>
)}
```

## Estado
✅ **FIX APLICADO** - El error está corregido en el código actualizado.
