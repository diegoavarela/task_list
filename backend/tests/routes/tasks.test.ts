import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import taskRoutes from '../../src/routes/tasks';
import { authenticateToken } from '../../src/middleware/auth';
import { injectTenantContext, validateTenantAccess } from '../../src/middleware/tenant';

// Mock the database
jest.mock('../../src/db/connection');

const app = express();
app.use(express.json());

// Mock middleware
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/tenant');

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockInjectTenantContext = injectTenantContext as jest.MockedFunction<typeof injectTenantContext>;
const mockValidateTenantAccess = validateTenantAccess as jest.MockedFunction<typeof validateTenantAccess>;

// Setup middleware mocks
mockAuthenticateToken.mockImplementation((req: any, res, next) => {
  req.user = {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    role: 'owner',
    clerkUserId: 'clerk-user-1'
  };
  next();
});

mockInjectTenantContext.mockImplementation((req: any, res, next) => {
  req.tenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    subscriptionTier: 'normal',
    subscriptionStatus: 'active'
  };
  next();
});

mockValidateTenantAccess.mockImplementation((req, res, next) => {
  next();
});

app.use('/api/tasks', taskRoutes);

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return tasks for authenticated user', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          name: 'Test Task',
          tenantId: 'tenant-1',
          completed: false,
          priority: 'medium',
          status: 'todo',
          createdAt: new Date(),
        },
      ];

      const { db } = require('../../src/db/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(mockTasks)
              })
            })
          })
        })
      });

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.tasks).toEqual(mockTasks);
    });

    it('should apply filters correctly', async () => {
      const { db } = require('../../src/db/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      await request(app)
        .get('/api/tasks?status=completed&priority=high')
        .expect(200);

      // Verify that the query was built with filters
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        name: 'New Task',
        description: 'Task description',
        priority: 'high',
        companyId: 'company-1',
      };

      const mockCreatedTask = {
        id: 'task-2',
        ...newTask,
        tenantId: 'tenant-1',
        createdById: 'user-1',
        completed: false,
        status: 'todo',
        createdAt: new Date(),
      };

      const { db } = require('../../src/db/connection');
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedTask])
        })
      });

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body).toMatchObject({
        name: newTask.name,
        description: newTask.description,
        priority: newTask.priority,
      });
    });

    it('should return 400 for missing task name', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          description: 'Task without name',
        })
        .expect(400);

      expect(response.body.error).toBe('Task name is required');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const taskId = 'task-1';
      const updates = {
        name: 'Updated Task Name',
        priority: 'low',
        completed: true,
      };

      const mockExistingTask = {
        id: taskId,
        name: 'Original Task',
        tenantId: 'tenant-1',
        completed: false,
      };

      const mockUpdatedTask = {
        ...mockExistingTask,
        ...updates,
        updatedAt: new Date(),
      };

      const { db } = require('../../src/db/connection');
      
      // Mock select for checking existing task
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExistingTask])
          })
        })
      });

      // Mock update
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedTask])
          })
        })
      });

      // Mock delete for tags/dependencies (cleanup)
      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      });

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        name: updates.name,
        priority: updates.priority,
        completed: updates.completed,
      });
    });

    it('should return 404 for non-existent task', async () => {
      const { db } = require('../../src/db/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]) // No task found
          })
        })
      });

      const response = await request(app)
        .put('/api/tasks/non-existent')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      const taskId = 'task-1';
      const mockExistingTask = {
        id: taskId,
        name: 'Task to Delete',
        tenantId: 'tenant-1',
      };

      const { db } = require('../../src/db/connection');
      
      // Mock select for checking existing task
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockExistingTask])
          })
        })
      });

      // Mock delete operations
      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      });

      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(204);
    });

    it('should return 404 for non-existent task', async () => {
      const { db } = require('../../src/db/connection');
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]) // No task found
          })
        })
      });

      const response = await request(app)
        .delete('/api/tasks/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('POST /api/tasks/bulk-update', () => {
    it('should bulk update multiple tasks', async () => {
      const taskIds = ['task-1', 'task-2'];
      const updates = { priority: 'high', status: 'in_progress' };

      const mockUpdatedTasks = taskIds.map(id => ({
        id,
        name: `Task ${id}`,
        ...updates,
        updatedAt: new Date(),
      }));

      const { db } = require('../../src/db/connection');
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(mockUpdatedTasks)
          })
        })
      });

      const response = await request(app)
        .post('/api/tasks/bulk-update')
        .send({ taskIds, updates })
        .expect(200);

      expect(response.body.updated).toBe(2);
      expect(response.body.tasks).toHaveLength(2);
    });

    it('should return 400 for missing task IDs', async () => {
      const response = await request(app)
        .post('/api/tasks/bulk-update')
        .send({ updates: { priority: 'high' } })
        .expect(400);

      expect(response.body.error).toBe('Task IDs are required');
    });
  });
});