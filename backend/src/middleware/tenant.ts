import { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection';
import { tenants, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from './auth';

export const injectTenantContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract tenant information from the request
    let tenantId = req.user?.tenantId;
    
    // Alternative: Extract from subdomain or header
    if (!tenantId) {
      const subdomain = req.headers['x-tenant-slug'] || req.headers['host']?.split('.')[0];
      if (subdomain) {
        const tenant = await db.select().from(tenants).where(eq(tenants.slug, subdomain as string)).limit(1);
        if (tenant.length > 0) {
          tenantId = tenant[0].id;
        }
      }
    }

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    // Verify tenant exists and is active
    const tenant = await db.select().from(tenants).where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.isActive, true)
      )
    ).limit(1);

    if (tenant.length === 0) {
      res.status(404).json({ error: 'Tenant not found or inactive' });
      return;
    }

    req.tenant = {
      id: tenant[0].id,
      name: tenant[0].name,
      subscriptionTier: tenant[0].subscriptionTier,
      subscriptionStatus: tenant[0].subscriptionStatus,
    };

    next();
  } catch (error) {
    console.error('Tenant context injection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateTenantAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.tenant) {
      res.status(401).json({ error: 'Authentication and tenant context required' });
      return;
    }

    // Verify user belongs to the tenant
    const userInTenant = await db.select().from(users).where(
      and(
        eq(users.id, req.user.id),
        eq(users.tenantId, req.tenant.id),
        eq(users.isActive, true)
      )
    ).limit(1);

    if (userInTenant.length === 0) {
      res.status(403).json({ error: 'User does not have access to this tenant' });
      return;
    }

    next();
  } catch (error) {
    console.error('Tenant access validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};