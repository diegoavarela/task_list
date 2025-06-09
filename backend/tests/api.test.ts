import request from 'supertest';
import { app } from '../src/index';

describe('Backend API Tests', () => {
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    // Initialize test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  beforeEach(async () => {
    // Reset database state for each test
  });

  describe('Health Checks', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should respond to database health check', async () => {
      const response = await request(app)
        .get('/health/db')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Tenant Registration', () => {
    test('should register a new tenant', async () => {
      const tenantData = {
        name: 'Test Tenant',
        domain: 'test.com',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
        plan: 'free'
      };

      const response = await request(app)
        .post('/api/tenants/register')
        .send(tenantData)
        .expect(201);

      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      
      tenantId = response.body.tenant.id;
      userId = response.body.user.id;
      authToken = response.body.token;
    });

    test('should reject duplicate tenant registration', async () => {
      const tenantData = {
        name: 'Test Tenant',
        domain: 'test.com',
        adminEmail: 'admin@test.com',
        adminPassword: 'password123',
        plan: 'free'
      };

      // First registration should succeed
      await request(app)
        .post('/api/tenants/register')
        .send(tenantData)
        .expect(201);

      // Second registration with same email should fail
      await request(app)
        .post('/api/tenants/register')
        .send(tenantData)
        .expect(409);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tenants/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Authentication', () => {
    beforeEach(async () => {
      // Register a tenant for auth tests
      const tenantData = {
        name: 'Auth Test Tenant',
        domain: 'auth-test.com',
        adminEmail: 'auth@test.com',
        adminPassword: 'password123',
        plan: 'free'
      };

      const response = await request(app)
        .post('/api/tenants/register')
        .send(tenantData);

      authToken = response.body.token;
      userId = response.body.user.id;
      tenantId = response.body.tenant.id;
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    test('should protect authenticated routes', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });

    test('should allow access with valid token', async () => {
      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Task Management', () => {
    beforeEach(async () => {
      // Setup auth for task tests
      const tenantData = {
        name: 'Task Test Tenant',
        domain: 'task-test.com',
        adminEmail: 'task@test.com',
        adminPassword: 'password123',
        plan: 'pro'
      };

      const response = await request(app)
        .post('/api/tenants/register')
        .send(tenantData);

      authToken = response.body.token;
      userId = response.body.user.id;
      tenantId = response.body.tenant.id;
    });

    test('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'high',
        status: 'todo',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.tenantId).toBe(tenantId);
      
      taskId = response.body.id;
    });

    test('should list tasks for tenant', async () => {
      // Create a task first
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'List Test Task',
          status: 'todo'
        });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should get task by ID', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Get Test Task',
          status: 'todo'
        });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('Get Test Task');
    });

    test('should update task', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Test Task',
          status: 'todo'
        });

      const taskId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Task',
          status: 'in_progress'
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Test Task');
      expect(response.body.status).toBe('in_progress');
    });

    test('should delete task', async () => {
      // Create a task first
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Test Task',
          status: 'todo'
        });

      const taskId = createResponse.body.id;

      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should filter tasks by status', async () => {
      // Create tasks with different statuses
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Todo Task', status: 'todo' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'In Progress Task', status: 'in_progress' });

      const response = await request(app)
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((task: any) => task.status === 'todo')).toBe(true);
    });

    test('should filter tasks by priority', async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'High Priority Task', priority: 'high' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Low Priority Task', priority: 'low' });

      const response = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.every((task: any) => task.priority === 'high')).toBe(true);
    });
  });

  describe('User Management', () => {
    beforeEach(async () => {
      const tenantData = {
        name: 'User Test Tenant',
        domain: 'user-test.com',
        adminEmail: 'user@test.com',
        adminPassword: 'password123',
        plan: 'enterprise'
      };

      const response = await request(app)
        .post('/api/tenants/register')
        .send(tenantData);

      authToken = response.body.token;
      userId = response.body.user.id;
      tenantId = response.body.tenant.id;
    });

    test('should create a new user', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: 'member'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body.role).toBe(userData.role);
      expect(response.body.tenantId).toBe(tenantId);
    });

    test('should list users in tenant', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should update user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@test.com'
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('updated@test.com');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      const tenantData = {
        name: 'Subscription Test Tenant',
        domain: 'sub-test.com',
        adminEmail: 'sub@test.com',
        adminPassword: 'password123',
        plan: 'free'
      };

      const response = await request(app)
        .post('/api/tenants/register')
        .send(tenantData);

      authToken = response.body.token;
      userId = response.body.user.id;
      tenantId = response.body.tenant.id;
    });

    test('should get subscription status', async () => {
      const response = await request(app)
        .get('/api/subscriptions/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('status');
    });

    test('should create subscription', async () => {
      const subscriptionData = {
        planId: 'pro',
        paymentMethodId: 'pm_test_123'
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.planId).toBe('pro');
    });

    test('should update subscription', async () => {
      // Create subscription first
      await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'pro',
          paymentMethodId: 'pm_test_123'
        });

      const response = await request(app)
        .put('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'enterprise'
        })
        .expect(200);

      expect(response.body.planId).toBe('enterprise');
    });

    test('should cancel subscription', async () => {
      // Create subscription first
      await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'pro',
          paymentMethodId: 'pm_test_123'
        });

      const response = await request(app)
        .delete('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('canceled');
    });
  });

  describe('Data Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;
    let tenant1TaskId: string;

    beforeEach(async () => {
      // Create first tenant
      const tenant1Response = await request(app)
        .post('/api/tenants/register')
        .send({
          name: 'Tenant 1',
          domain: 'tenant1.com',
          adminEmail: 'admin1@tenant1.com',
          adminPassword: 'password123'
        });

      tenant1Token = tenant1Response.body.token;

      // Create second tenant
      const tenant2Response = await request(app)
        .post('/api/tenants/register')
        .send({
          name: 'Tenant 2',
          domain: 'tenant2.com',
          adminEmail: 'admin2@tenant2.com',
          adminPassword: 'password123'
        });

      tenant2Token = tenant2Response.body.token;

      // Create task in tenant 1
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          title: 'Tenant 1 Task',
          status: 'todo'
        });

      tenant1TaskId = taskResponse.body.id;
    });

    test('should isolate tenant data', async () => {
      // Tenant 2 should not see tenant 1's tasks
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(response.body.length).toBe(0);
    });

    test('should prevent cross-tenant task access', async () => {
      // Tenant 2 should not be able to access tenant 1's task
      await request(app)
        .get(`/api/tasks/${tenant1TaskId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });

    test('should prevent cross-tenant task modification', async () => {
      // Tenant 2 should not be able to modify tenant 1's task
      await request(app)
        .put(`/api/tasks/${tenant1TaskId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({ title: 'Hacked Task' })
        .expect(404);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on auth endpoints', async () => {
      const requests = Array(25).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    beforeEach(async () => {
      const tenantData = {
        name: 'Validation Test Tenant',
        domain: 'validation-test.com',
        adminEmail: 'validation@test.com',
        adminPassword: 'password123'
      };

      const response = await request(app)
        .post('/api/tenants/register')
        .send(tenantData);

      authToken = response.body.token;
    });

    test('should validate task creation data', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('should sanitize task input', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '<script>alert("xss")</script>Clean Title',
          description: 'Clean description',
          status: 'todo'
        })
        .expect(201);

      expect(response.body.title).not.toContain('<script>');
    });

    test('should validate email format', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);
    });

    test('should enforce password strength', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'test@test.com',
          password: '123',
          name: 'Test User'
        })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // This would require mocking the database connection
      // For now, just test that errors are properly formatted
      const response = await request(app)
        .get('/api/tasks/nonexistent-id')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});