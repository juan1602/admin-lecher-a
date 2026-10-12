import axios from 'axios';
import { getToken, cerrarSesion } from '../lib/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8092/api',
  headers: { 'Content-Type': 'application/json' },
  // Render puede tardar en responder; con poco tiempo la petición "falla" aunque el servidor sí guarde
  timeout: 30000,
});

// Enviar la llave de sesión en cada petición
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor dice que la sesión no sirve, volver a la pantalla de contraseña
api.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      cerrarSesion();
    }
    return Promise.reject(error);
  }
);

export default api;
