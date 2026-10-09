import api from './api';

export const medicalRecordService = {
  getMedicalRecords: async (params = {}) => {
    const response = await api.get('/medical-records', { params });
    return response.data;
  },

  getMedicalRecord: async (id) => {
    const response = await api.get(`/medical-records/${id}`);
    return response.data;
  },

  createMedicalRecord: async (recordData) => {
    const response = await api.post('/medical-records', recordData);
    return response.data;
  },

  updateMedicalRecord: async (id, recordData) => {
    const response = await api.put(`/medical-records/${id}`, recordData);
    return response.data;
  },

  deleteMedicalRecord: async (id) => {
    const response = await api.delete(`/medical-records/${id}`);
    return response.data;
  },
};

export default medicalRecordService;
