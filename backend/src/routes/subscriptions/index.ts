import express, { Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { injectTenantContext, validateTenantAccess } from '../../middleware/tenant';

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(injectTenantContext);
router.use(validateTenantAccess);

// GET /api/subscriptions/current - Get current subscription
router.get('/current', async (req: any, res: Response) => {
  try {
    // Return subscription info from tenant context
    res.json({
      tier: req.tenant?.subscriptionTier || 'free',
      status: req.tenant?.subscriptionStatus || 'active',
      features: getSubscriptionFeatures(req.tenant?.subscriptionTier || 'free')
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// GET /api/subscriptions/plans - Get available plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    res.json({
      plans: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          features: getSubscriptionFeatures('free')
        },
        {
          id: 'normal',
          name: 'Professional',
          price: 19,
          features: getSubscriptionFeatures('normal')
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          features: getSubscriptionFeatures('enterprise')
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Helper function to get subscription features
function getSubscriptionFeatures(tier: string) {
  const features = {
    free: {
      users: 3,
      tasks: 50,
      storage: '100 MB',
      support: 'Community',
      analytics: false,
      integrations: false
    },
    normal: {
      users: 25,
      tasks: 'Unlimited',
      storage: '5 GB',
      support: 'Email',
      analytics: true,
      integrations: true
    },
    enterprise: {
      users: 'Unlimited',
      tasks: 'Unlimited',
      storage: '50 GB',
      support: 'Priority',
      analytics: true,
      integrations: true
    }
  };

  return features[tier as keyof typeof features] || features.free;
}

export default router;