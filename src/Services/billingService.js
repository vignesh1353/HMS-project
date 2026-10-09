import api from './api';

export const billingService = {
  getBills: async (params = {}) => {
    const response = await api.get('/billing', { params });
    return response.data;
  },

  getBill: async (id) => {
    const response = await api.get(`/billing/${id}`);
    return response.data;
  },

  createBill: async (billData) => {
    const response = await api.post('/billing', billData);
    return response.data;
  },

  updateBill: async (id, billData) => {
    const response = await api.put(`/billing/${id}`, billData);
    return response.data;
  },

  updatePaymentStatus: async (id, paymentStatus, paymentMethod) => {
    const response = await api.patch(`/billing/${id}/payment-status`, {
      paymentStatus,
      paymentMethod,
    });
    return response.data;
  },

  approveBill: async (id) => {
    const response = await api.patch(`/billing/${id}/approve`);
    return response.data;
  },

  deleteBill: async (id) => {
    const response = await api.delete(`/billing/${id}`);
    return response.data;
  },
};

export default billingService;
