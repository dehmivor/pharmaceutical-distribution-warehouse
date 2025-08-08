import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const useReport = () => {
  const [reportData, setReportData] = useState({
    comprehensive: { bills: [], summary: {} },
    period: [],
    partner: [],
    medicine: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    period: 'monthly',
    status: '',
    type: '',
    partnerType: '',
    reportType: 'comprehensive'
  });

  // Fetch comprehensive report
  const fetchComprehensiveReport = async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      const currentFilters = { ...filters, ...customFilters };

      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate.toISOString());
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate.toISOString());
      if (currentFilters.period) params.append('period', currentFilters.period);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.type) params.append('type', currentFilters.type);
      if (currentFilters.partnerType) params.append('partnerType', currentFilters.partnerType);

      const response = await axios.get(`${API_BASE_URL}/api/reports/comprehensive?${params.toString()}`, { headers: getAuthHeaders() });

      if (response.data.success) {
        setReportData((prev) => ({
          ...prev,
          comprehensive: response.data.data
        }));
      } else {
        setError('Failed to load comprehensive report');
      }
    } catch (error) {
      console.error('Error fetching comprehensive report:', error);
      setError(error.response?.data?.error || 'Failed to load comprehensive report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch period report
  const fetchPeriodReport = async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = { ...filters, ...customFilters };

      if (!currentFilters.startDate || !currentFilters.endDate) {
        setError('Start date and end date are required');
        return;
      }

      const params = new URLSearchParams();
      params.append('startDate', currentFilters.startDate.toISOString());
      params.append('endDate', currentFilters.endDate.toISOString());
      params.append('period', currentFilters.period || 'monthly');

      const response = await axios.get(`${API_BASE_URL}/api/reports/period?${params.toString()}`, { headers: getAuthHeaders() });

      if (response.data.success) {
        setReportData((prev) => ({
          ...prev,
          period: response.data.data
        }));
      } else {
        setError('Failed to load period report');
      }
    } catch (error) {
      console.error('Error fetching period report:', error);
      setError(error.response?.data?.error || 'Failed to load period report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch partner analysis report
  const fetchPartnerReport = async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = { ...filters, ...customFilters };

      if (!currentFilters.startDate || !currentFilters.endDate) {
        setError('Start date and end date are required');
        return;
      }

      const params = new URLSearchParams();
      params.append('startDate', currentFilters.startDate.toISOString());
      params.append('endDate', currentFilters.endDate.toISOString());

      const response = await axios.get(`${API_BASE_URL}/api/reports/partner-analysis?${params.toString()}`, { headers: getAuthHeaders() });

      if (response.data.success) {
        setReportData((prev) => ({
          ...prev,
          partner: response.data.data
        }));
      } else {
        setError('Failed to load partner analysis report');
      }
    } catch (error) {
      console.error('Error fetching partner analysis report:', error);
      setError(error.response?.data?.error || 'Failed to load partner analysis report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch medicine analysis report
  const fetchMedicineReport = async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = { ...filters, ...customFilters };

      if (!currentFilters.startDate || !currentFilters.endDate) {
        setError('Start date and end date are required');
        return;
      }

      const params = new URLSearchParams();
      params.append('startDate', currentFilters.startDate.toISOString());
      params.append('endDate', currentFilters.endDate.toISOString());

      const response = await axios.get(`${API_BASE_URL}/api/reports/medicine-analysis?${params.toString()}`, { headers: getAuthHeaders() });

      if (response.data.success) {
        setReportData((prev) => ({
          ...prev,
          medicine: response.data.data
        }));
      } else {
        setError('Failed to load medicine analysis report');
      }
    } catch (error) {
      console.error('Error fetching medicine analysis report:', error);
      setError(error.response?.data?.error || 'Failed to load medicine analysis report');
    } finally {
      setLoading(false);
    }
  };

  // Export report to Excel
  const exportToExcel = async (reportType = 'comprehensive', customFilters = {}) => {
    try {
      setLoading(true);
      const currentFilters = { ...filters, ...customFilters };

      const params = new URLSearchParams();
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate.toISOString());
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate.toISOString());
      if (currentFilters.period) params.append('period', currentFilters.period);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.type) params.append('type', currentFilters.type);
      if (currentFilters.partnerType) params.append('partnerType', currentFilters.partnerType);
      params.append('reportType', reportType);

      const response = await axios.get(`${API_BASE_URL}/api/reports/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const uploadFile = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/api/reports/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh all reports
  const refreshAllReports = async () => {
    await Promise.all([fetchComprehensiveReport(), fetchPeriodReport(), fetchPartnerReport(), fetchMedicineReport()]);
  };

  return {
    reportData,
    loading,
    error,
    filters,
    fetchComprehensiveReport,
    fetchPeriodReport,
    fetchPartnerReport,
    fetchMedicineReport,
    exportToExcel,
    uploadFile,
    updateFilters,
    clearError,
    refreshAllReports
  };
};

export default useReport;
