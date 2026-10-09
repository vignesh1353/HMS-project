import api from './api';

export const medicineRequestService = {
  getRequests: async (params = {}) => {
    const response = await api.get('/medicine-requests', { params });
    return response.data;
  },

  getRequest: async (id) => {
    const response = await api.get(`/medicine-requests/${id}`);
    return response.data;
  },

  createRequest: async (requestData) => {
    const response = await api.post('/medicine-requests', requestData);
    return response.data;
  },

  approveRequest: async (id, data = {}) => {
    const response = await api.patch(`/medicine-requests/${id}/approve`, data);
    return response.data;
  },

  rejectRequest: async (id, data = {}) => {
    const response = await api.patch(`/medicine-requests/${id}/reject`, data);
    return response.data;
  },

  dispenseRequest: async (id) => {
    const response = await api.patch(`/medicine-requests/${id}/dispense`);
    return response.data;
  },

  deleteRequest: async (id) => {
    const response = await api.delete(`/medicine-requests/${id}`);
    return response.data;
  },
};

export default medicineRequestService;
