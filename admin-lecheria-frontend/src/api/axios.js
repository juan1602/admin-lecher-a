import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8092/api',
  headers: { 'Content-Type': 'application/json' },
  // Render puede tardar en responder; con poco tiempo la petición "falla" aunque el servidor sí guarde
  timeout: 30000,
});

export default api;
