import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    clerkUserId: string;
  };
  tenant?: {
    id: string;
    name: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded.user;
    req.tenant = decoded.tenant;

    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireSubscription = (requiredTiers: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({ error: 'Tenant context required' });
      return;
    }

    if (!requiredTiers.includes(req.tenant.subscriptionTier)) {
      res.status(403).json({ 
        error: 'Subscription upgrade required',
        requiredTier: requiredTiers,
        currentTier: req.tenant.subscriptionTier
      });
      return;
    }

    if (req.tenant.subscriptionStatus !== 'active') {
      res.status(403).json({ 
        error: 'Subscription is not active',
        status: req.tenant.subscriptionStatus
      });
      return;
    }

    next();
  };
};