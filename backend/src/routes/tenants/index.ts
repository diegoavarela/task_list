import express, { Request, Response } from 'express';
import { db } from '../../db/connection';
import { tenants, users, tasks } from '../../db/schema';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { injectTenantContext, validateTenantAccess } from '../../middleware/tenant';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/tenants/current - Get current tenant info
router.get('/current', injectTenantContext, validateTenantAccess, async (req: any, res: Response) => {
  try {
    const tenant = await db.select().from(tenants).where(eq(tenants.id, req.tenant!.id)).limit(1);
    
    if (tenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant[0]);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// PUT /api/tenants/current - Update current tenant
router.put('/current', injectTenantContext, validateTenantAccess, requireRole(['owner', 'admin']), async (req: any, res: Response) => {
  try {
    const { name, domain, settings } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tenant name is required' });
    }

    const updatedTenant = await db.update(tenants)
      .set({
        name: name.trim(),
        domain,
        settings,
        updatedAt: new Date()
      })
      .where(eq(tenants.id, req.tenant!.id))
      .returning();

    res.json(updatedTenant[0]);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// GET /api/tenants/usage - Get tenant usage statistics
router.get('/usage', injectTenantContext, validateTenantAccess, requireRole(['owner', 'admin']), async (req: any, res: Response) => {
  try {
    // Get user count
    const userCount = await db.select({ count: 'count(*)' }).from(users).where(
      and(
        eq(users.tenantId, req.tenant!.id),
        eq(users.isActive, true)
      )
    );

    // Get task count
    const taskCount = await db.select({ count: 'count(*)' }).from(tasks).where(eq(tasks.tenantId, req.tenant!.id));

    // Get storage usage (placeholder - implement based on file storage)
    const storageUsage = 0; // TODO: Calculate actual storage usage

    // Get subscription limits
    const limits = getSubscriptionLimits(req.tenant!.subscriptionTier);

    res.json({
      users: {
        current: parseInt(userCount[0].count as string),
        limit: limits.users
      },
      tasks: {
        current: parseInt(taskCount[0].count as string),
        limit: limits.tasks
      },
      storage: {
        current: storageUsage,
        limit: limits.storage
      },
      subscriptionTier: req.tenant!.subscriptionTier
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

// GET /api/tenants/members - Get tenant members
router.get('/members', injectTenantContext, validateTenantAccess, async (req: any, res: Response) => {
  try {
    const members = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      avatar: users.avatar,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt
    }).from(users).where(eq(users.tenantId, req.tenant!.id));

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// POST /api/tenants/members/invite - Invite new member
router.post('/members/invite', injectTenantContext, validateTenantAccess, requireRole(['owner', 'admin']), async (req: any, res: Response) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists in tenant
    const existingUser = await db.select().from(users).where(
      and(
        eq(users.email, email.trim().toLowerCase()),
        eq(users.tenantId, req.tenant!.id)
      )
    ).limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists in this tenant' });
    }

    // Check subscription limits
    const userCount = await db.select({ count: 'count(*)' }).from(users).where(
      and(
        eq(users.tenantId, req.tenant!.id),
        eq(users.isActive, true)
      )
    );

    const limits = getSubscriptionLimits(req.tenant!.subscriptionTier);
    if (parseInt(userCount[0].count as string) >= limits.users) {
      return res.status(403).json({ 
        error: 'User limit reached for current subscription',
        currentUsers: parseInt(userCount[0].count as string),
        limit: limits.users
      });
    }

    // TODO: Send invitation email
    // For now, just return success
    res.json({ 
      message: 'Invitation sent successfully',
      email: email.trim().toLowerCase(),
      role 
    });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// PUT /api/tenants/members/:userId - Update member role
router.put('/members/:userId', injectTenantContext, validateTenantAccess, requireRole(['owner', 'admin']), async (req: any, res: Response) => {
  try {
    const { role, isActive } = req.body;

    // Validate role
    const validRoles = ['owner', 'admin', 'manager', 'member'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists in tenant
    const existingUser = await db.select().from(users).where(
      and(
        eq(users.id, req.params.userId),
        eq(users.tenantId, req.tenant!.id)
      )
    ).limit(1);

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found in this tenant' });
    }

    // Prevent removing the last owner
    if (existingUser[0].role === 'owner' && role !== 'owner') {
      const ownerCount = await db.select({ count: 'count(*)' }).from(users).where(
        and(
          eq(users.tenantId, req.tenant!.id),
          eq(users.role, 'owner'),
          eq(users.isActive, true)
        )
      );

      if (parseInt(ownerCount[0].count as string) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last owner' });
      }
    }

    const updatedUser = await db.update(users)
      .set({
        role,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.params.userId))
      .returning();

    res.json({
      id: updatedUser[0].id,
      email: updatedUser[0].email,
      firstName: updatedUser[0].firstName,
      lastName: updatedUser[0].lastName,
      role: updatedUser[0].role,
      isActive: updatedUser[0].isActive
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Helper function to get subscription limits
function getSubscriptionLimits(tier: string) {
  const limits = {
    free: { users: 3, tasks: 50, storage: 100 * 1024 * 1024 }, // 100MB
    normal: { users: 25, tasks: -1, storage: 5 * 1024 * 1024 * 1024 }, // 5GB
    enterprise: { users: -1, tasks: -1, storage: 50 * 1024 * 1024 * 1024 } // 50GB
  };

  return limits[tier as keyof typeof limits] || limits.free;
}

export default router;