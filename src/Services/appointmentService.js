import api from './api';

export const appointmentService = {
  getAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  getAppointment: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  approveAppointment: async (id, data = {}) => {
    const response = await api.patch(`/appointments/${id}/approve`, data);
    return response.data;
  },

  rejectAppointment: async (id, data = {}) => {
    const response = await api.patch(`/appointments/${id}/reject`, data);
    return response.data;
  },

  assignDoctor: async (id, data) => {
    const response = await api.patch(`/appointments/${id}/assign-doctor`, data);
    return response.data;
  },

  assignRoom: async (id, data) => {
    const response = await api.patch(`/appointments/${id}/assign-room`, data);
    return response.data;
  },

  updateAppointment: async (id, appointmentData) => {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },

  updateAppointmentStatus: async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  },

  deleteAppointment: async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  checkAvailability: async (params = {}) => {
    const response = await api.get('/appointments/check-availability', { params });
    return response.data;
  },
};

export default appointmentService;
