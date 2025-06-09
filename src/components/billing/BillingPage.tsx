import { useState, useEffect } from 'react';
import { CreditCard, Download, Settings, Calendar, Receipt, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { PlanSelection } from './PlanSelection';
import { PaymentMethods } from './PaymentMethods';
import { InvoiceHistory } from './InvoiceHistory';
import { BillingSettings } from './BillingSettings';
import { PaymentService } from '@/services/paymentService';
import type { Subscription, Plan } from '@/services/paymentService';
import { format, formatDistanceToNow } from 'date-fns';

interface BillingPageProps {
  onClose?: () => void;
}

export function BillingPage({ onClose }: BillingPageProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const userId = 'current-user'; // In real app, get from auth context

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = () => {
    setLoading(true);
    try {
      const currentSub = PaymentService.getCurrentSubscription(userId);
      setSubscription(currentSub);
      
      if (currentSub) {
        const plan = PaymentService.getPlans().find(p => p.id === currentSub.planId);
        setCurrentPlan(plan || null);
      } else {
        // No subscription, default to free plan
        const freePlan = PaymentService.getPlans().find(p => p.id === 'free');
        setCurrentPlan(freePlan || null);
      }
      
      // Generate mock invoices if needed
      if (currentSub && currentSub.planId !== 'free') {
        PaymentService.generateMockInvoices(userId);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
      toast({
        title: 'Error loading billing data',
        description: 'Please refresh the page and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    try {
      const success = await PaymentService.cancelSubscription(userId);
      if (success) {
        await loadBillingData();
        toast({
          title: 'Subscription cancelled',
          description: 'Your subscription will remain active until the end of the current billing period.',
        });
      }
    } catch (error) {
      toast({
        title: 'Cancellation failed',
        description: 'Unable to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await PaymentService.createCustomerPortalSession(userId);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: 'Unable to open billing portal',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Subscription['status']) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      canceled: { variant: 'destructive' as const, label: 'Cancelled' },
      past_due: { variant: 'destructive' as const, label: 'Past Due' },
      unpaid: { variant: 'destructive' as const, label: 'Unpaid' },
      trialing: { variant: 'secondary' as const, label: 'Trial' },
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
            <p className="text-muted-foreground">Manage your subscription and billing information.</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information.
          </p>
        </div>
        <Button onClick={() => setShowPlanSelection(true)} className="gap-2">
          <CreditCard className="h-4 w-4" />
          {subscription ? 'Change Plan' : 'Choose Plan'}
        </Button>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                  <p className="text-muted-foreground">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {PaymentService.formatCurrency(currentPlan.price, currentPlan.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">per {currentPlan.interval}</div>
                </div>
              </div>

              {subscription && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Status</div>
                    <div>{getStatusBadge(subscription.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Current Period</div>
                    <div className="text-sm text-muted-foreground">
                      {format(subscription.currentPeriodStart, 'MMM d')} - {format(subscription.currentPeriodEnd, 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Next Billing</div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.cancelAtPeriodEnd ? (
                        <span className="text-destructive">Cancels on {format(subscription.currentPeriodEnd, 'MMM d, yyyy')}</span>
                      ) : (
                        <>In {formatDistanceToNow(subscription.currentPeriodEnd)}</>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {subscription && subscription.planId !== 'free' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Manage Billing
                  </Button>
                  {!subscription.cancelAtPeriodEnd && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      className="gap-2"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm text-yellow-800">
                    Your subscription will be cancelled at the end of the current billing period. 
                    You can reactivate it anytime before then.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No active subscription</p>
              <Button 
                onClick={() => setShowPlanSelection(true)} 
                className="mt-4"
              >
                Choose a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Management Tabs */}
      <Tabs defaultValue="payment-methods" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoice History</TabsTrigger>
          <TabsTrigger value="settings">Billing Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods">
          <PaymentMethods userId={userId} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceHistory userId={userId} />
        </TabsContent>

        <TabsContent value="settings">
          <BillingSettings userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Plan Selection Dialog */}
      <Dialog open={showPlanSelection} onOpenChange={setShowPlanSelection}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
          </DialogHeader>
          <PlanSelection
            currentSubscription={subscription}
            onPlanSelected={(plan) => {
              setShowPlanSelection(false);
              loadBillingData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}