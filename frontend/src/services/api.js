import axios from 'axios';

//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const API_URL = '/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============= AUTENTICACIÓN =============

export const authService = {
  loginUsuario: async (email, password) => {
    const response = await api.post('/auth/login/usuario', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));
    }
    return response.data;
  },

  loginParticipante: async (email, password) => {
    const response = await api.post('/auth/login/participante', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.participante));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  verificarToken: async () => {
    const response = await api.get('/auth/verificar');
    return response.data;
  },

  registrarUsuario: async (usuario) => {
    const response = await api.post('/auth/registrar-usuario', usuario);
    return response.data;
  },
};

// ============= USUARIOS (ENTRENADORES/ADMINS) =============

export const usuariosService = {
  obtenerTodos: async () => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  cambiarPassword: async (id, nueva_password) => {
    const response = await api.patch(`/usuarios/${id}/cambiar-password`, { nueva_password });
    return response.data;
  },

  cambiarEmail: async (id, nuevo_email) => {
    const response = await api.patch(`/usuarios/${id}/cambiar-email`, { nuevo_email });
    return response.data;
  },
};

// ============= PARTICIPANTES =============

export const participantesService = {
  obtenerTodos: async () => {
    const response = await api.get('/participantes');
    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await api.get(`/participantes/${id}`);
    return response.data;
  },

  crear: async (participante) => {
    const response = await api.post('/participantes', participante);
    return response.data;
  },

  actualizar: async (id, participante) => {
    const response = await api.put(`/participantes/${id}`, participante);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/participantes/${id}`);
    return response.data;
  },

  cambiarPassword: async (id, nueva_password) => {
    const response = await api.patch(`/participantes/${id}/cambiar-password`, { nueva_password });
    return response.data;
  },

  cambiarPasswordPropia: async (password_actual, password_nueva) => {
    const response = await api.patch('/participantes/mi-cuenta/cambiar-password', {
      password_actual,
      password_nueva
    });
    return response.data;
  },

  cambiarEmailPropio: async (password, nuevo_email) => {
    const response = await api.patch('/participantes/mi-cuenta/cambiar-email', {
      password,
      nuevo_email
    });
    return response.data;
  },

  cambiarEmail: async (id, nuevo_email) => {
    const response = await api.patch(`/participantes/${id}/cambiar-email`, { nuevo_email });
    return response.data;
  },
};

// ============= ENTRENAMIENTO =============

export const entrenamientoService = {
  obtenerPlan: async (participante_id, mes_año) => {
    try {
      const response = await api.get(`/entrenamiento/plan/${participante_id}/${mes_año}`);
      return response.data;
    } catch (error) {
      // Si es 404, retornar estructura vacía en lugar de error
      if (error.response?.status === 404) {
        console.log('⚠️ No hay plan para este mes (404), retornando estructura vacía');
        return { plan: null, ejercicios: [] };
      }
      // Para otros errores, propagar
      throw error;
    }
  },

  guardarPlan: async (plan) => {
    const response = await api.post('/entrenamiento/plan', plan);
    return response.data;
  },

  obtenerPlanes: async (participante_id) => {
    const response = await api.get(`/entrenamiento/planes/${participante_id}`);
    return response.data;
  },

  eliminarPlan: async (id) => {
    const response = await api.delete(`/entrenamiento/plan/${id}`);
    return response.data;
  },

  registrarEntrenamiento: async (registro) => {
    const response = await api.post('/entrenamiento/registro', registro);
    return response.data;
  },

  obtenerRegistros: async (participante_id, fecha_inicio, fecha_fin) => {
    const params = { participante_id };
    if (fecha_inicio) params.fecha_inicio = fecha_inicio;
    if (fecha_fin) params.fecha_fin = fecha_fin;
    
    const response = await api.get('/entrenamiento/registros', { params });
    return response.data;
  },

  obtenerHistorialEjercicio: async (participante_id, ejercicio_plan_id) => {
    const response = await api.get(`/entrenamiento/historial/${participante_id}/${ejercicio_plan_id}`);
    return response.data;
  },

  obtenerUltimoRegistro: async (participante_id, ejercicio_plan_id) => {
    const response = await api.get(`/entrenamiento/ultimo-registro/${participante_id}/${ejercicio_plan_id}`);
    return response.data;
  },

  actualizarRegistro: async (id, registro) => {
    const response = await api.put(`/entrenamiento/registro/${id}`, registro);
    return response.data;
  },

  eliminarRegistro: async (id) => {
    const response = await api.delete(`/entrenamiento/registro/${id}`);
    return response.data;
  },

  subirImagenEjercicio: async (file) => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post('/entrenamiento/ejercicio/imagen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  eliminarImagenEjercicio: async (imagen_url) => {
    const response = await api.delete('/entrenamiento/ejercicio/imagen', {
      data: { imagen_url }
    });
    return response.data;
  },
};

// ============= CATÁLOGO DE EJERCICIOS =============

export const catalogoService = {
  listar: async (params = {}) => {
    const response = await api.get('/catalogo', { params });
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`/catalogo/${id}`);
    return response.data;
  },

  crear: async (ejercicio) => {
    const response = await api.post('/catalogo', ejercicio);
    return response.data;
  },

  actualizar: async (id, ejercicio) => {
    const response = await api.put(`/catalogo/${id}`, ejercicio);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/catalogo/${id}`);
    return response.data;
  },

  subirImagen: async (id, file) => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await api.post(`/catalogo/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  eliminarImagen: async (id, slot) => {
    const response = await api.delete(`/catalogo/${id}/imagen/${slot}`);
    return response.data;
  },
};

// ============= PLANTILLAS =============

export const plantillasService = {
  listar: async (params = {}) => {
    const response = await api.get('/plantillas', { params });
    return response.data;
  },

  obtener: async (id) => {
    const response = await api.get(`/plantillas/${id}`);
    return response.data;
  },

  crear: async (plantilla) => {
    const response = await api.post('/plantillas', plantilla);
    return response.data;
  },

  actualizar: async (id, plantilla) => {
    const response = await api.put(`/plantillas/${id}`, plantilla);
    return response.data;
  },

  eliminar: async (id) => {
    const response = await api.delete(`/plantillas/${id}`);
    return response.data;
  },

  duplicar: async (id, nombre) => {
    const response = await api.post(`/plantillas/${id}/duplicar`, { nombre });
    return response.data;
  },
};

// ============= ASIGNACIONES =============

export const asignacionesService = {
  asignar: async (asignacion) => {
    const response = await api.post('/asignaciones', asignacion);
    return response.data;
  },

  obtenerAsignacion: async (participante_id, mes_anio) => {
    try {
      const response = await api.get(`/asignaciones/participante/${participante_id}/${mes_anio}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { asignacion: null, dias: [] };
      }
      throw error;
    }
  },

  obtenerPlanActual: async (participante_id) => {
    try {
      const response = await api.get(`/asignaciones/participante/${participante_id}/actual`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { asignacion: null, dias: [] };
      }
      throw error;
    }
  },

  obtenerHistorial: async (participante_id) => {
    const response = await api.get(`/asignaciones/participante/${participante_id}`);
    return response.data;
  },

  cambiar: async (id, asignacion) => {
    const response = await api.put(`/asignaciones/${id}`, asignacion);
    return response.data;
  },

  // Registros de entrenamiento v2
  registrarEntrenamiento: async (registro) => {
    const response = await api.post('/asignaciones/registro', registro);
    return response.data;
  },

  obtenerRegistros: async (participante_id, fecha_inicio, fecha_fin) => {
    const params = { participante_id };
    if (fecha_inicio) params.fecha_inicio = fecha_inicio;
    if (fecha_fin) params.fecha_fin = fecha_fin;
    const response = await api.get('/asignaciones/registros', { params });
    return response.data;
  },

  actualizarRegistro: async (id, registro) => {
    const response = await api.put(`/asignaciones/registro/${id}`, registro);
    return response.data;
  },

  eliminarRegistro: async (id) => {
    const response = await api.delete(`/asignaciones/registro/${id}`);
    return response.data;
  },

  obtenerHistorialEjercicio: async (participante_id, snapshot_ejercicio_id) => {
    const response = await api.get(`/asignaciones/historial/${participante_id}/${snapshot_ejercicio_id}`);
    return response.data;
  },

  obtenerUltimoRegistro: async (participante_id, snapshot_ejercicio_id) => {
    const response = await api.get(`/asignaciones/ultimo-registro/${participante_id}/${snapshot_ejercicio_id}`);
    return response.data;
  },
};

// ============= ENTRENAMIENTO V2 =============

export const entrenamientoV2Service = {
  obtenerPlanes: async (participante_id) => {
    const response = await api.get(`/entrenamiento-v2/planes/participante/${participante_id}`);
    return response.data;
  },

  obtenerPlan: async (plan_id) => {
    const response = await api.get(`/entrenamiento-v2/plan/${plan_id}`);
    return response.data;
  },

  crearPlan: async (plan) => {
    const response = await api.post('/entrenamiento-v2/plan', plan);
    return response.data;
  },

  actualizarPlan: async (plan_id, plan) => {
    const response = await api.put(`/entrenamiento-v2/plan/${plan_id}`, plan);
    return response.data;
  },

  eliminarPlan: async (plan_id) => {
    const response = await api.delete(`/entrenamiento-v2/plan/${plan_id}`);
    return response.data;
  },

  agregarDia: async (plan_id, dia) => {
    const response = await api.post(`/entrenamiento-v2/plan/${plan_id}/dia`, dia);
    return response.data;
  },

  actualizarDia: async (dia_id, dia) => {
    const response = await api.put(`/entrenamiento-v2/dia/${dia_id}`, dia);
    return response.data;
  },

  eliminarDia: async (dia_id) => {
    const response = await api.delete(`/entrenamiento-v2/dia/${dia_id}`);
    return response.data;
  },

  agregarEjercicio: async (dia_id, ejercicio) => {
    const response = await api.post(`/entrenamiento-v2/dia/${dia_id}/ejercicio`, ejercicio);
    return response.data;
  },

  actualizarEjercicio: async (ejercicio_id, ejercicio) => {
    const response = await api.put(`/entrenamiento-v2/ejercicio/${ejercicio_id}`, ejercicio);
    return response.data;
  },

  eliminarEjercicio: async (ejercicio_id) => {
    const response = await api.delete(`/entrenamiento-v2/ejercicio/${ejercicio_id}`);
    return response.data;
  },

  registrarEjercicio: async (registro) => {
    const response = await api.post('/entrenamiento-v2/registro', registro);
    return response.data;
  },

  obtenerHistorial: async (participante_id, ejercicio_dia_id) => {
    const response = await api.get(`/entrenamiento-v2/historial/${participante_id}/${ejercicio_dia_id}`);
    return response.data;
  },

  obtenerProgreso: async (participante_id, plan_id) => {
    const response = await api.get(`/entrenamiento-v2/progreso/${participante_id}/${plan_id}`);
    return response.data;
  },
};

// ============= NUTRICIÓN =============

export const nutricionService = {
  obtenerPlan: async (participante_id) => {
    const response = await api.get(`/nutricion/plan/${participante_id}`);
    return response.data;
  },

  guardarPlan: async (plan) => {
    const response = await api.post('/nutricion/plan', plan);
    return response.data;
  },

  actualizarPlan: async (id, plan) => {
    const response = await api.put(`/nutricion/plan/${id}`, plan);
    return response.data;
  },

  obtenerHistorial: async (participante_id) => {
    const response = await api.get(`/nutricion/historial/${participante_id}`);
    return response.data;
  },

  eliminarPlan: async (id) => {
    const response = await api.delete(`/nutricion/plan/${id}`);
    return response.data;
  },
};

export default api;
