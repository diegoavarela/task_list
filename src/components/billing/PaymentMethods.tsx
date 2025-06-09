import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { PaymentService } from '@/services/paymentService';
import type { PaymentMethod } from '@/services/paymentService';

interface PaymentMethodsProps {
  userId: string;
}

export function PaymentMethods({ userId }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCvc, setShowCvc] = useState(false);
  const { toast } = useToast();

  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, [userId]);

  const loadPaymentMethods = () => {
    const methods = PaymentService.getPaymentMethods(userId);
    setPaymentMethods(methods);
  };

  const handleAddPaymentMethod = async () => {
    if (!cardNumber || !expiryMonth || !expiryYear || !cvc) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all card details.',
        variant: 'destructive',
      });
      return;
    }

    // Basic validation
    if (cardNumber.replace(/\s/g, '').length < 13) {
      toast({
        title: 'Invalid card number',
        description: 'Please enter a valid card number.',
        variant: 'destructive',
      });
      return;
    }

    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    if (month < 1 || month > 12) {
      toast({
        title: 'Invalid expiry month',
        description: 'Please enter a valid month (1-12).',
        variant: 'destructive',
      });
      return;
    }

    if (year < new Date().getFullYear()) {
      toast({
        title: 'Invalid expiry year',
        description: 'Card has expired.',
        variant: 'destructive',
      });
      return;
    }

    if (cvc.length < 3) {
      toast({
        title: 'Invalid CVC',
        description: 'Please enter a valid CVC.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await PaymentService.addPaymentMethod(userId, {
        type: 'card',
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiryMonth: month,
        expiryYear: year,
        cvc,
        isDefault: isDefault || paymentMethods.length === 0
      });

      loadPaymentMethods();
      setShowAddDialog(false);
      resetForm();
      
      toast({
        title: 'Payment method added',
        description: 'Your payment method has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Failed to add payment method',
        description: 'Please check your card details and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      await PaymentService.removePaymentMethod(paymentMethodId);
      loadPaymentMethods();
      
      toast({
        title: 'Payment method removed',
        description: 'The payment method has been removed from your account.',
      });
    } catch (error) {
      toast({
        title: 'Failed to remove payment method',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvc('');
    setIsDefault(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardBrandIcon = (brand?: string) => {
    switch (brand) {
      case 'visa':
        return '💳'; // In real app, use Visa icon
      case 'mastercard':
        return '💳'; // In real app, use Mastercard icon
      case 'amex':
        return '💳'; // In real app, use Amex icon
      case 'discover':
        return '💳'; // In real app, use Discover icon
      default:
        return '💳';
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No payment methods added</p>
              <p className="text-xs">Add a payment method to manage your subscription</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card key={method.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getCardBrandIcon(method.brand)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              •••• •••• •••• {method.last4}
                            </span>
                            {method.isDefault && (
                              <Badge className="bg-green-100 text-green-800 border-0">Default</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {method.brand?.toUpperCase()} • Expires {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Added {method.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Card Number</Label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <select
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">MM</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Year</Label>
                <select
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">YYYY</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>CVC</Label>
                <div className="relative">
                  <Input
                    type={showCvc ? "text" : "password"}
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCvc(!showCvc)}
                  >
                    {showCvc ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="default" className="text-sm">
                Set as default payment method
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPaymentMethod} disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}