const request = require('supertest');
const app = require('../server');

describe('Server', () => {
  test('should respond to health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});
