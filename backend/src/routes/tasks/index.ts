import express, { Request, Response, NextFunction } from 'express';
import { db } from '../../db/connection';
import { tasks, taskTags, taskComments, taskDependencies, taskTimeEntries } from '../../db/schema';
import { authenticateToken, requireSubscription } from '../../middleware/auth';
import { injectTenantContext, validateTenantAccess } from '../../middleware/tenant';
import { eq, and, desc, asc, inArray, isNull } from 'drizzle-orm';
import { AuthenticatedRequest } from '../../types/auth';

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(injectTenantContext);
router.use(validateTenantAccess);

// GET /api/tasks - Get all tasks for tenant
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      priority, 
      assignedTo, 
      companyId, 
      categoryId,
      search,
      includeCompleted = 'true',
      includeArchived = 'false'
    } = req.query;

    if (!req.tenant?.id) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    let query = db.select().from(tasks).where(eq(tasks.tenantId, req.tenant.id));

    // Apply filters
    if (status) {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.status, status as string)));
    }

    if (priority) {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.priority, priority as string)));
    }

    if (assignedTo) {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.assignedToId, assignedTo as string)));
    }

    if (companyId) {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.companyId, companyId as string)));
    }

    if (categoryId) {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.categoryId, categoryId as string)));
    }

    if (includeCompleted === 'false') {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.completed, false)));
    }

    if (includeArchived === 'false') {
      query = query.where(and(eq(tasks.tenantId, req.tenant.id), eq(tasks.isArchived, false)));
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    const results = await query
      .orderBy(asc(tasks.order), desc(tasks.createdAt))
      .limit(Number(limit))
      .offset(offset);

    res.json({
      tasks: results,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: results.length
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /api/tasks - Create new task
router.post('/', requireSubscription(['free', 'normal', 'enterprise']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant?.id || !req.user?.id) {
      res.status(400).json({ error: 'Authentication required' });
      return;
    }

    const {
      name,
      notes,
      priority = 'medium',
      status = 'todo',
      dueDate,
      dueTime,
      reminderDate,
      estimatedHours,
      companyId,
      categoryId,
      assignedToId,
      tagIds = [],
      isRecurring = false,
      recurringPattern,
      parentTaskId
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Task name is required' });
      return;
    }

    const newTask = await db.insert(tasks).values({
      tenantId: req.tenant.id,
      createdById: req.user.id,
      name,
      notes,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime,
      reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      estimatedHours,
      companyId,
      categoryId,
      assignedToId: assignedToId || req.user.id,
      isRecurring,
      recurringPattern,
      parentTaskId,
      completed: false,
      isArchived: false
    }).returning();

    // Handle tags if provided
    if (tagIds.length > 0) {
      const tagInserts = tagIds.map((tagId: string) => ({
        taskId: newTask[0].id,
        tagId
      }));
      await db.insert(taskTags).values(tagInserts);
    }

    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant?.id || !req.user?.id) {
      res.status(400).json({ error: 'Authentication required' });
      return;
    }

    const taskId = req.params.id;
    const updates = req.body;

    // Verify task belongs to tenant
    const existingTask = await db.select().from(tasks).where(
      and(eq(tasks.id, taskId), eq(tasks.tenantId, req.tenant.id))
    ).limit(1);

    if (existingTask.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Update task
    const updatedTask = await db.update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        reminderDate: updates.reminderDate ? new Date(updates.reminderDate) : undefined,
        completedAt: updates.completed ? new Date() : null
      })
      .where(eq(tasks.id, taskId))
      .returning();

    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant?.id) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    const taskId = req.params.id;

    // Verify task belongs to tenant
    const existingTask = await db.select().from(tasks).where(
      and(eq(tasks.id, taskId), eq(tasks.tenantId, req.tenant.id))
    ).limit(1);

    if (existingTask.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Delete task and related data
    await db.delete(taskTags).where(eq(taskTags.taskId, taskId));
    await db.delete(taskComments).where(eq(taskComments.taskId, taskId));
    await db.delete(taskTimeEntries).where(eq(taskTimeEntries.taskId, taskId));
    await db.delete(tasks).where(eq(tasks.id, taskId));

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/bulk - Bulk operations
router.post('/bulk', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.tenant?.id || !req.user?.id) {
      res.status(400).json({ error: 'Authentication required' });
      return;
    }

    const { operation, taskIds, updates } = req.body;

    if (!operation || !taskIds || taskIds.length === 0) {
      res.status(400).json({ error: 'Operation and task IDs are required' });
      return;
    }

    // Verify all tasks belong to tenant
    const existingTasks = await db.select().from(tasks).where(
      and(inArray(tasks.id, taskIds), eq(tasks.tenantId, req.tenant.id))
    );

    if (existingTasks.length !== taskIds.length) {
      res.status(404).json({ error: 'Some tasks not found' });
      return;
    }

    switch (operation) {
      case 'update':
        if (!updates) {
          res.status(400).json({ error: 'Updates are required for update operation' });
          return;
        }
        await db.update(tasks)
          .set({ ...updates, updatedAt: new Date() })
          .where(inArray(tasks.id, taskIds));
        break;

      case 'delete':
        await db.delete(taskTags).where(inArray(taskTags.taskId, taskIds));
        await db.delete(taskComments).where(inArray(taskComments.taskId, taskIds));
        await db.delete(taskTimeEntries).where(inArray(taskTimeEntries.taskId, taskIds));
        await db.delete(tasks).where(inArray(tasks.id, taskIds));
        break;

      case 'archive':
        await db.update(tasks)
          .set({ isArchived: true, updatedAt: new Date() })
          .where(inArray(tasks.id, taskIds));
        break;

      default:
        res.status(400).json({ error: 'Invalid operation' });
        return;
    }

    res.json({ success: true, affected: taskIds.length });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

export default router;