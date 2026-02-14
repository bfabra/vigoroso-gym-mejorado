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
