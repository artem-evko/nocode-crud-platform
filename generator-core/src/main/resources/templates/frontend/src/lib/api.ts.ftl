import axios from 'axios';
<#if authEnabled>import { useAuthStore } from '../store/authStore';</#if>

export const api = axios.create({
  baseURL: '/api',
});

<#if authEnabled>
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${r"${token}"}`;
  }
  return config;
});
</#if>
