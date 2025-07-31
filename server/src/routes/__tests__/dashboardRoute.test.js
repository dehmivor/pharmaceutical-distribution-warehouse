const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Mock data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  email: 'test@example.com',
  role: 'representative',
  status: 'active'
};

const mockToken = jwt.sign(
  { id: mockUser._id, email: mockUser.email, role: mockUser.role },
  process.env.JWT_SECRET || 'test-secret',
  { expiresIn: '1h' }
);

describe('Dashboard API Routes', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/dashboard/representative', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .get('/api/dashboard/representative')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should return 401 if invalid token provided', async () => {
      const response = await request(app)
        .get('/api/dashboard/representative')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    it('should return dashboard data with valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/representative')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('monthlyChart');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data).toHaveProperty('topExport');
      expect(response.body.data).toHaveProperty('recentActivity');
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    it('should return stats data with valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exportOrders');
      expect(response.body.data).toHaveProperty('importOrders');
      expect(response.body.data).toHaveProperty('contracts');
      expect(response.body.data).toHaveProperty('dateRange');
    });

    it('should return stats data with custom date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const response = await request(app)
        .get(`/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.dateRange.start).toBeDefined();
      expect(response.body.data.dateRange.end).toBeDefined();
    });
  });
}); 