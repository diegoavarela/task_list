import { useState } from 'react';
import { Check, Crown, Star, Zap, Users, HardDrive, Headphones, BarChart3, Code, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { PaymentService } from '@/services/paymentService';
import type { Plan, Subscription } from '@/services/paymentService';

interface PlanSelectionProps {
  currentSubscription?: Subscription | null;
  onPlanSelected?: (plan: Plan) => void;
}

export function PlanSelection({ currentSubscription, onPlanSelected }: PlanSelectionProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const { toast } = useToast();
  
  const plans = PaymentService.getPlans();

  const handleSelectPlan = async (plan: Plan) => {
    if (currentSubscription?.planId === plan.id) {
      toast({
        title: 'Already subscribed',
        description: `You are already on the ${plan.name} plan.`,
      });
      return;
    }

    setLoading(plan.id);
    try {
      if (plan.id === 'free') {
        // Subscribe to free plan immediately
        await PaymentService.subscribeToFreePlan('current-user');
        toast({
          title: 'Plan updated',
          description: 'You have been switched to the Free plan.',
        });
        onPlanSelected?.(plan);
      } else {
        // Redirect to Stripe checkout for paid plans
        const { url } = await PaymentService.createCheckoutSession(plan.id, 'current-user');
        window.open(url, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process plan selection. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('task')) return <Check className="h-4 w-4" />;
    if (feature.includes('user')) return <Users className="h-4 w-4" />;
    if (feature.includes('storage')) return <HardDrive className="h-4 w-4" />;
    if (feature.includes('support')) return <Headphones className="h-4 w-4" />;
    if (feature.includes('analytics')) return <BarChart3 className="h-4 w-4" />;
    if (feature.includes('API')) return <Code className="h-4 w-4" />;
    if (feature.includes('branding')) return <Sparkles className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <Users className="h-6 w-6" />;
      case 'pro': return <Star className="h-6 w-6" />;
      case 'business': return <Zap className="h-6 w-6" />;
      case 'enterprise': return <Crown className="h-6 w-6" />;
      default: return <Users className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.planId === planId;
  };

  const canUpgrade = (planId: string) => {
    if (!currentSubscription) return true;
    return PaymentService.canUpgrade(currentSubscription.planId, planId);
  };

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-muted p-1 rounded-lg flex">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'year'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge className="ml-2 bg-green-100 text-green-800 border-0">Save 20%</Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const yearlyPrice = billingInterval === 'year' ? plan.price * 12 * 0.8 : plan.price * 12;
          const displayPrice = billingInterval === 'year' ? yearlyPrice / 12 : plan.price;
          
          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-primary border-primary' : ''
              } ${isCurrentPlan(plan.id) ? 'bg-primary/5' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <div className={`p-3 rounded-full ${
                    plan.id === 'free' ? 'bg-gray-100' :
                    plan.id === 'pro' ? 'bg-blue-100' :
                    plan.id === 'business' ? 'bg-purple-100' :
                    'bg-yellow-100'
                  }`}>
                    {getPlanIcon(plan.id)}
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {PaymentService.formatCurrency(displayPrice, plan.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {billingInterval}
                    {billingInterval === 'year' && plan.price > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        Save {PaymentService.formatCurrency(plan.price * 12 * 0.2, plan.currency)} yearly
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="text-green-600 flex-shrink-0">
                        {getFeatureIcon(feature)}
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loading === plan.id || (isCurrentPlan(plan.id) && !plan.id !== 'free')}
                  className={`w-full ${
                    isCurrentPlan(plan.id) 
                      ? 'bg-muted text-muted-foreground cursor-default' 
                      : plan.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.id ? (
                    'Processing...'
                  ) : isCurrentPlan(plan.id) ? (
                    'Current Plan'
                  ) : canUpgrade(plan.id) ? (
                    plan.id === 'free' ? 'Downgrade' : 'Upgrade'
                  ) : (
                    'Select Plan'
                  )}
                </Button>

                {isCurrentPlan(plan.id) && currentSubscription && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      {currentSubscription.status === 'active' ? (
                        <>Renews on {currentSubscription.currentPeriodEnd.toLocaleDateString()}</>
                      ) : (
                        <>Status: {currentSubscription.status}</>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4 border-b">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-2 px-4 border-b">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr>
                  <td className="py-3 px-4 border-b font-medium">Max Tasks</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 border-b">
                      {plan.maxTasks === -1 ? 'Unlimited' : plan.maxTasks?.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b font-medium">Max Users</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 border-b">
                      {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b font-medium">Storage</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 border-b">
                      {plan.maxStorage === -1 ? 'Unlimited' : `${plan.maxStorage}GB`}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b font-medium">Priority Support</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 border-b">
                      {plan.prioritySupport ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b font-medium">Advanced Analytics</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 border-b">
                      {plan.advancedAnalytics ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 border-b font-medium">API Access</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 border-b">
                      {plan.apiAccess ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Custom Branding</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.customBranding ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}