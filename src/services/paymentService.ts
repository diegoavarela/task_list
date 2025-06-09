import type { User } from '@/types/user';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
  popular?: boolean;
  maxTasks?: number;
  maxUsers?: number;
  maxStorage?: number; // in GB
  customBranding?: boolean;
  prioritySupport?: boolean;
  advancedAnalytics?: boolean;
  apiAccess?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'paypal' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'draft';
  description: string;
  invoiceUrl?: string;
  paidAt?: Date;
  dueDate: Date;
  createdAt: Date;
}

export interface BillingSettings {
  companyName?: string;
  vatNumber?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  emailNotifications: {
    invoices: boolean;
    paymentFailed: boolean;
    subscriptionChanges: boolean;
  };
}

// Mock Stripe configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_stripe_key';

export class PaymentService {
  private static readonly STORAGE_KEY = 'payment_data';
  private static readonly SETTINGS_KEY = 'billing_settings';
  
  static getPlans(): Plan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for personal use',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Up to 50 tasks',
          '1 user',
          '1GB storage',
          'Basic templates',
          'Email support'
        ],
        maxTasks: 50,
        maxUsers: 1,
        maxStorage: 1
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'Great for small teams',
        price: 12,
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_pro_monthly',
        popular: true,
        features: [
          'Unlimited tasks',
          'Up to 5 users',
          '50GB storage',
          'Advanced templates',
          'Calendar integration',
          'Priority support',
          'Advanced analytics'
        ],
        maxTasks: -1, // unlimited
        maxUsers: 5,
        maxStorage: 50,
        prioritySupport: true,
        advancedAnalytics: true
      },
      {
        id: 'business',
        name: 'Business',
        description: 'Perfect for growing businesses',
        price: 24,
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_business_monthly',
        features: [
          'Unlimited tasks',
          'Up to 25 users',
          '500GB storage',
          'Custom branding',
          'API access',
          'Advanced integrations',
          'Dedicated support',
          'Advanced analytics'
        ],
        maxTasks: -1,
        maxUsers: 25,
        maxStorage: 500,
        customBranding: true,
        prioritySupport: true,
        advancedAnalytics: true,
        apiAccess: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: 99,
        currency: 'USD',
        interval: 'month',
        stripePriceId: 'price_enterprise_monthly',
        features: [
          'Unlimited everything',
          'Unlimited users',
          'Unlimited storage',
          'Custom branding',
          'API access',
          'SSO integration',
          'Custom integrations',
          '24/7 dedicated support',
          'Advanced analytics & reporting'
        ],
        maxTasks: -1,
        maxUsers: -1,
        maxStorage: -1,
        customBranding: true,
        prioritySupport: true,
        advancedAnalytics: true,
        apiAccess: true
      }
    ];
  }

  static getCurrentSubscription(userId: string): Subscription | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;
    
    try {
      const parsed = JSON.parse(data);
      const subscription = parsed.subscriptions?.find((s: Subscription) => s.userId === userId);
      if (subscription) {
        return {
          ...subscription,
          currentPeriodStart: new Date(subscription.currentPeriodStart),
          currentPeriodEnd: new Date(subscription.currentPeriodEnd),
          trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : undefined,
          createdAt: new Date(subscription.createdAt),
          updatedAt: new Date(subscription.updatedAt)
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  static getPaymentMethods(userId: string): PaymentMethod[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      const methods = parsed.paymentMethods?.filter((pm: PaymentMethod) => pm.userId === userId) || [];
      return methods.map((pm: PaymentMethod) => ({
        ...pm,
        createdAt: new Date(pm.createdAt)
      }));
    } catch {
      return [];
    }
  }

  static getInvoices(userId: string): Invoice[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      const subscription = this.getCurrentSubscription(userId);
      if (!subscription) return [];
      
      const invoices = parsed.invoices?.filter((inv: Invoice) => inv.subscriptionId === subscription.id) || [];
      return invoices.map((inv: Invoice) => ({
        ...inv,
        paidAt: inv.paidAt ? new Date(inv.paidAt) : undefined,
        dueDate: new Date(inv.dueDate),
        createdAt: new Date(inv.createdAt)
      }));
    } catch {
      return [];
    }
  }

  static getBillingSettings(userId: string): BillingSettings {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    if (!data) {
      return {
        emailNotifications: {
          invoices: true,
          paymentFailed: true,
          subscriptionChanges: true
        }
      };
    }
    
    try {
      const parsed = JSON.parse(data);
      return parsed[userId] || {
        emailNotifications: {
          invoices: true,
          paymentFailed: true,
          subscriptionChanges: true
        }
      };
    } catch {
      return {
        emailNotifications: {
          invoices: true,
          paymentFailed: true,
          subscriptionChanges: true
        }
      };
    }
  }

  static async createCheckoutSession(planId: string, userId: string): Promise<{ sessionId: string; url: string }> {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan || plan.price === 0) {
      throw new Error('Invalid plan selected');
    }

    // Mock Stripe checkout session creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const sessionId = `cs_mock_${crypto.randomUUID()}`;
    const url = `https://checkout.stripe.com/pay/${sessionId}`;
    
    return { sessionId, url };
  }

  static async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    // Mock Stripe customer portal session creation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const url = `https://billing.stripe.com/session/mock_${userId}`;
    return { url };
  }

  static async subscribeToFreePlan(userId: string): Promise<Subscription> {
    const freePlan = this.getPlans().find(p => p.id === 'free');
    if (!freePlan) {
      throw new Error('Free plan not found');
    }

    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage
    const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    if (!parsed.subscriptions) {
      parsed.subscriptions = [];
    }
    
    // Remove any existing subscription for this user
    parsed.subscriptions = parsed.subscriptions.filter((s: Subscription) => s.userId !== userId);
    parsed.subscriptions.push(subscription);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
    
    return subscription;
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    const subscription = this.getCurrentSubscription(userId);
    if (!subscription) {
      return false;
    }

    // Mock cancellation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    if (parsed.subscriptions) {
      parsed.subscriptions = parsed.subscriptions.map((s: Subscription) => 
        s.userId === userId 
          ? { ...s, cancelAtPeriodEnd: true, updatedAt: new Date() }
          : s
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return true;
  }

  static async addPaymentMethod(userId: string, paymentData: {
    type: 'card';
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    isDefault?: boolean;
  }): Promise<PaymentMethod> {
    // Mock payment method creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const paymentMethod: PaymentMethod = {
      id: crypto.randomUUID(),
      userId,
      type: paymentData.type,
      last4: paymentData.cardNumber.slice(-4),
      brand: this.getCardBrand(paymentData.cardNumber),
      expiryMonth: paymentData.expiryMonth,
      expiryYear: paymentData.expiryYear,
      isDefault: paymentData.isDefault || false,
      stripePaymentMethodId: `pm_mock_${crypto.randomUUID()}`,
      createdAt: new Date()
    };

    // Save to localStorage
    const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    if (!parsed.paymentMethods) {
      parsed.paymentMethods = [];
    }
    
    // If this is set as default, unset other defaults
    if (paymentMethod.isDefault) {
      parsed.paymentMethods = parsed.paymentMethods.map((pm: PaymentMethod) => 
        pm.userId === userId ? { ...pm, isDefault: false } : pm
      );
    }
    
    parsed.paymentMethods.push(paymentMethod);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
    
    return paymentMethod;
  }

  static async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    // Mock payment method removal
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    if (parsed.paymentMethods) {
      parsed.paymentMethods = parsed.paymentMethods.filter((pm: PaymentMethod) => pm.id !== paymentMethodId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
    }
    
    return true;
  }

  static updateBillingSettings(userId: string, settings: BillingSettings): void {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    parsed[userId] = settings;
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(parsed));
  }

  private static getCardBrand(cardNumber: string): string {
    const sanitized = cardNumber.replace(/\s/g, '');
    
    if (sanitized.startsWith('4')) return 'visa';
    if (sanitized.startsWith('5') || sanitized.startsWith('2')) return 'mastercard';
    if (sanitized.startsWith('3')) return 'amex';
    if (sanitized.startsWith('6')) return 'discover';
    
    return 'unknown';
  }

  static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }

  static getPlanLimits(planId: string): Plan | null {
    return this.getPlans().find(p => p.id === planId) || null;
  }

  static canUpgrade(currentPlanId: string, targetPlanId: string): boolean {
    const plans = this.getPlans();
    const currentPlan = plans.find(p => p.id === currentPlanId);
    const targetPlan = plans.find(p => p.id === targetPlanId);
    
    if (!currentPlan || !targetPlan) return false;
    return targetPlan.price > currentPlan.price;
  }

  static generateMockInvoices(userId: string): void {
    const subscription = this.getCurrentSubscription(userId);
    if (!subscription || subscription.planId === 'free') return;
    
    const plan = this.getPlans().find(p => p.id === subscription.planId);
    if (!plan) return;
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    if (!parsed.invoices) {
      parsed.invoices = [];
    }
    
    // Generate 3 mock invoices
    for (let i = 0; i < 3; i++) {
      const invoiceDate = new Date();
      invoiceDate.setMonth(invoiceDate.getMonth() - i);
      
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency,
        status: i === 0 ? 'pending' : 'paid',
        description: `${plan.name} subscription`,
        invoiceUrl: `https://invoice.stripe.com/mock/${crypto.randomUUID()}`,
        paidAt: i === 0 ? undefined : invoiceDate,
        dueDate: invoiceDate,
        createdAt: invoiceDate
      };
      
      parsed.invoices.push(invoice);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
  }
}