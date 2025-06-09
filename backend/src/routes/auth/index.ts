import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../../db/connection';
import { users, tenants } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { authLimiter } from '../../middleware/rateLimiting';

const router = express.Router();

// Apply auth rate limiting to all routes
router.use(authLimiter);

// POST /api/auth/login - Login with Clerk user ID
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkUserId, tenantSlug } = req.body;

    if (!clerkUserId) {
      res.status(400).json({ error: 'Clerk user ID is required' });
      return;
    }

    // Find user
    let user;
    if (tenantSlug) {
      // Find user by tenant slug
      const tenant = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
      if (tenant.length === 0) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const userResult = await db.select().from(users).where(
        and(
          eq(users.clerkUserId, clerkUserId),
          eq(users.tenantId, tenant[0].id),
          eq(users.isActive, true)
        )
      ).limit(1);

      if (userResult.length === 0) {
        res.status(404).json({ error: 'User not found in this tenant' });
        return;
      }

      user = { ...userResult[0], tenant: tenant[0] };
    } else {
      // Find user's default tenant
      const userResult = await db.select().from(users).where(
        and(
          eq(users.clerkUserId, clerkUserId),
          eq(users.isActive, true)
        )
      ).limit(1);

      if (userResult.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const tenant = await db.select().from(tenants).where(eq(tenants.id, userResult[0].tenantId)).limit(1);
      if (tenant.length === 0) {
        res.status(404).json({ error: 'User tenant not found' });
        return;
      }

      user = { ...userResult[0], tenant: tenant[0] };
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate JWT
    const token = jwt.sign(
      {
        user: {
          id: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: user.role,
          clerkUserId: user.clerkUserId
        },
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subscriptionTier: user.tenant.subscriptionTier,
          subscriptionStatus: user.tenant.subscriptionStatus
        }
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        subscriptionTier: user.tenant.subscriptionTier,
        subscriptionStatus: user.tenant.subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register - Register new user (typically called after Clerk signup)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      clerkUserId,
      email,
      firstName,
      lastName,
      tenantName,
      tenantSlug,
      role = 'owner'
    } = req.body;

    if (!clerkUserId || !email || !tenantName || !tenantSlug) {
      res.status(400).json({ 
        error: 'Clerk user ID, email, tenant name, and tenant slug are required' 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (existingUser.length > 0) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Check if tenant slug is available
    const existingTenant = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
    if (existingTenant.length > 0) {
      res.status(409).json({ error: 'Tenant slug already taken' });
      return;
    }

    // Create tenant
    const newTenant = await db.insert(tenants).values({
      name: tenantName,
      slug: tenantSlug,
      subscriptionTier: 'free',
      subscriptionStatus: 'active'
    }).returning();

    // Create user
    const newUser = await db.insert(users).values({
      tenantId: newTenant[0].id,
      clerkUserId,
      email,
      firstName,
      lastName,
      role
    }).returning();

    // Generate JWT
    const token = jwt.sign(
      {
        user: {
          id: newUser[0].id,
          tenantId: newUser[0].tenantId,
          email: newUser[0].email,
          role: newUser[0].role,
          clerkUserId: newUser[0].clerkUserId
        },
        tenant: {
          id: newTenant[0].id,
          name: newTenant[0].name,
          subscriptionTier: newTenant[0].subscriptionTier,
          subscriptionStatus: newTenant[0].subscriptionStatus
        }
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        firstName: newUser[0].firstName,
        lastName: newUser[0].lastName,
        role: newUser[0].role,
        avatar: newUser[0].avatar
      },
      tenant: {
        id: newTenant[0].id,
        name: newTenant[0].name,
        slug: newTenant[0].slug,
        subscriptionTier: newTenant[0].subscriptionTier,
        subscriptionStatus: newTenant[0].subscriptionStatus
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/verify - Verify token
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is active
    const user = await db.select().from(users).where(
      and(
        eq(users.id, decoded.user.id),
        eq(users.isActive, true)
      )
    ).limit(1);

    if (user.length === 0) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Verify tenant still exists and is active
    const tenant = await db.select().from(tenants).where(
      and(
        eq(tenants.id, decoded.tenant.id),
        eq(tenants.isActive, true)
      )
    ).limit(1);

    if (tenant.length === 0) {
      res.status(401).json({ error: 'Tenant not found or inactive' });
      return;
    }

    res.json({
      valid: true,
      user: decoded.user,
      tenant: decoded.tenant
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;