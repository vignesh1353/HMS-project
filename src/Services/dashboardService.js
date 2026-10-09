import api from './api';

export const dashboardService = {
  getAdminStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getClientStats: async () => {
    const response = await api.get('/dashboard/client-stats');
    return response.data;
  },

  getDoctorStats: async () => {
    const response = await api.get('/dashboard/doctor-stats');
    return response.data;
  },
};

export default dashboardService;
