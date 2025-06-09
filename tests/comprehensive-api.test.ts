import request from 'supertest';
import { app } from '../backend/src/index';

describe('Comprehensive API Tests', () => {
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    // Setup test environment
  });

  describe('Authentication & Authorization', () => {
    test('should register a new tenant', async () => {
      const response = await request(app)
        .post('/api/tenants/register')
        .send({
          name: 'Test Company',
          domain: 'test-company.com',
          adminEmail: 'admin@test-company.com',
          adminPassword: 'testpassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('token');
      
      tenantId = response.body.tenant.id;
      authToken = response.body.token;
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test-company.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      
      userId = response.body.user.id;
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test-company.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    test('should protect routes with authentication', async () => {
      const response = await request(app)
        .get('/api/tasks');

      expect(response.status).toBe(401);
    });
  });

  describe('User Management', () => {
    test('should create a new user in tenant', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'user@test-company.com',
          password: 'userpassword123',
          name: 'Test User',
          role: 'member'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('user@test-company.com');
    });

    test('should list users in tenant', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should update user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test User',
          email: 'updated@test-company.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Updated Test User');
    });
  });

  describe('Task Management', () => {
    test('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'high',
          status: 'todo',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.title).toBe('Test Task');
      
      taskId = response.body.task.id;
    });

    test('should list tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.task.id).toBe(taskId);
    });

    test('should update task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Task',
          status: 'in_progress'
        });

      expect(response.status).toBe(200);
      expect(response.body.task.title).toBe('Updated Test Task');
      expect(response.body.task.status).toBe('in_progress');
    });

    test('should add subtask', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Subtask',
          description: 'This is a test subtask'
        });

      expect(response.status).toBe(201);
      expect(response.body.subtask.title).toBe('Test Subtask');
    });

    test('should assign task to user', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: userId
        });

      expect(response.status).toBe(200);
      expect(response.body.task.assigneeId).toBe(userId);
    });

    test('should add comment to task', async () => {
      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment'
        });

      expect(response.status).toBe(201);
      expect(response.body.comment.content).toBe('This is a test comment');
    });

    test('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Tenant Management', () => {
    test('should get tenant information', async () => {
      const response = await request(app)
        .get('/api/tenants/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tenant.id).toBe(tenantId);
    });

    test('should update tenant settings', async () => {
      const response = await request(app)
        .put('/api/tenants/current')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Company',
          settings: {
            theme: 'dark',
            notifications: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.tenant.name).toBe('Updated Test Company');
    });
  });

  describe('Data Isolation Tests', () => {
    test('should not access other tenant data', async () => {
      // Create second tenant
      const tenant2Response = await request(app)
        .post('/api/tenants/register')
        .send({
          name: 'Test Company 2',
          domain: 'test-company-2.com',
          adminEmail: 'admin@test-company-2.com',
          adminPassword: 'testpassword123'
        });

      const tenant2Token = tenant2Response.body.token;

      // Try to access first tenant's tasks with second tenant's token
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tenant2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0); // Should not see other tenant's tasks
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const promises = Array(20).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Database Health', () => {
    test('should connect to database', async () => {
      const response = await request(app)
        .get('/api/health/db')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
});