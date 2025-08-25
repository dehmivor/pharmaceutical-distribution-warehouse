import axios from 'axios';

class SearchService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api'
    });
  }

  // Thêm interceptor để tự động gửi token
  setupInterceptors() {
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Search theo role và keyword
  async searchByRole(role, keyword, limit = 10) {
    try {
      this.setupInterceptors();

      let endpoint = '';
      let params = { q: keyword, limit };

      switch (role) {
        case 'supervisor':
          // Supervisor có thể search tất cả
          endpoint = '/search/global';
          params.role = 'supervisor';
          break;

        case 'warehouse_manager':
          // Warehouse manager search inventory, orders, locations
          endpoint = '/search/warehouse';
          break;

        case 'warehouse':
          // Warehouse user search inventory, locations
          endpoint = '/search/warehouse-basic';
          break;

        case 'representative':
          // Representative search orders, contracts
          endpoint = '/search/representative';
          break;

        case 'representative_manager':
          // Representative manager search orders, contracts, users
          endpoint = '/search/representative-manager';
          break;

        default:
          endpoint = '/search/basic';
      }

      const response = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Search nhanh theo context hiện tại
  async quickSearch(context, keyword, limit = 5) {
    try {
      this.setupInterceptors();

      const response = await this.api.get(`/search/${context}`, {
        params: { q: keyword, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Quick search error:', error);
      throw error;
    }
  }
}

export default new SearchService();
