import express, { Request, Response } from 'express';
import { db } from '../../db/connection';
import { users } from '../../db/schema';
import { authenticateToken } from '../../middleware/auth';
import { injectTenantContext, validateTenantAccess } from '../../middleware/tenant';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(injectTenantContext);
router.use(validateTenantAccess);

// GET /api/users/me - Get current user profile
router.get('/me', async (req: any, res: Response) => {
  try {
    const user = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      avatar: users.avatar,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, req.user!.id)).limit(1);

    if (user.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT /api/users/me - Update current user profile
router.put('/me', async (req: any, res: Response) => {
  try {
    const { firstName, lastName, avatar } = req.body;

    const updatedUser = await db.update(users)
      .set({
        firstName,
        lastName,
        avatar,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user!.id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatar: users.avatar
      });

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// GET /api/users - Get all users in tenant (for assignment, etc.)
router.get('/', async (req: any, res: Response) => {
  try {
    const tenantUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      avatar: users.avatar,
      isActive: users.isActive
    }).from(users).where(
      and(
        eq(users.tenantId, req.tenant!.id),
        eq(users.isActive, true)
      )
    );

    res.json(tenantUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;