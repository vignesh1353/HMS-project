import api from './api';

export const medicalReportService = {
  getReports: async (params = {}) => {
    const response = await api.get('/medical-reports', { params });
    return response.data;
  },

  getReport: async (id) => {
    const response = await api.get(`/medical-reports/${id}`);
    return response.data;
  },

  createReport: async (reportData) => {
    const response = await api.post('/medical-reports', reportData);
    return response.data;
  },

  submitReport: async (id, data = {}) => {
    const response = await api.post(`/medical-reports/${id}/submit`, data);
    return response.data;
  },

  updateReport: async (id, reportData) => {
    const response = await api.put(`/medical-reports/${id}`, reportData);
    return response.data;
  },

  approveReport: async (id, data = {}) => {
    const response = await api.patch(`/medical-reports/${id}/approve`, data);
    return response.data;
  },

  rejectReport: async (id, data = {}) => {
    const response = await api.patch(`/medical-reports/${id}/reject`, data);
    return response.data;
  },

  downloadPdf: async (id, filename = 'medical-report.pdf') => {
    const response = await api.get(`/medical-reports/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/medical-reports/${id}`);
    return response.data;
  },
};

export default medicalReportService;
