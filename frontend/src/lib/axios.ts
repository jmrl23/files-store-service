import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.DEV
    ? 'http://localhost:3001'
    : window.location.origin,
});
