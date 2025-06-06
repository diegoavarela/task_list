import { Request } from 'express';

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
    slug: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
}

export interface JWTPayload {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    clerkUserId: string;
  };
  tenant: {
    id: string;
    name: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
}