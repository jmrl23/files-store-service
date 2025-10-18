import axios from 'axios';

export const api = axios.create({
  baseURL:
    import.meta.env.DEV || import.meta.env.VITE_IN_DOCKER
      ? 'http://localhost:3001'
      : window.location.origin,
});
