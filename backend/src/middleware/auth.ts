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

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded.user;
    req.tenant = decoded.tenant;

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireSubscription = (requiredTiers: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({ error: 'Tenant context required' });
    }

    if (!requiredTiers.includes(req.tenant.subscriptionTier)) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        requiredTier: requiredTiers,
        currentTier: req.tenant.subscriptionTier
      });
    }

    if (req.tenant.subscriptionStatus !== 'active') {
      return res.status(403).json({ 
        error: 'Subscription is not active',
        status: req.tenant.subscriptionStatus
      });
    }

    next();
  };
};