import { useState, useEffect } from 'react';
import { Settings, Building, MapPin, Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { PaymentService } from '@/services/paymentService';
import type { BillingSettings as BillingSettingsType } from '@/services/paymentService';

interface BillingSettingsProps {
  userId: string;
}

export function BillingSettings({ userId }: BillingSettingsProps) {
  const [settings, setSettings] = useState<BillingSettingsType>({
    emailNotifications: {
      invoices: true,
      paymentFailed: true,
      subscriptionChanges: true
    }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = () => {
    const userSettings = PaymentService.getBillingSettings(userId);
    setSettings(userSettings);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      PaymentService.updateBillingSettings(userId, settings);
      toast({
        title: 'Settings saved',
        description: 'Your billing settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Unable to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<BillingSettingsType>) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  };

  const updateAddress = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      address: {
        ...prev.address,
        line1: '',
        city: '',
        postalCode: '',
        country: '',
        ...prev.address,
        [field]: value
      }
    }));
  };

  const updateNotifications = (field: keyof BillingSettingsType['emailNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [field]: value
      }
    }));
  };

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Germany',
    'France',
    'Australia',
    'Japan',
    'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                placeholder="Your Company Name"
                value={settings.companyName || ''}
                onChange={(e) => updateSettings({ companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>VAT Number (Optional)</Label>
              <Input
                placeholder="VAT123456789"
                value={settings.vatNumber || ''}
                onChange={(e) => updateSettings({ vatNumber: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Billing Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input
              placeholder="123 Main Street"
              value={settings.address?.line1 || ''}
              onChange={(e) => updateAddress('line1', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Address Line 2 (Optional)</Label>
            <Input
              placeholder="Apartment, suite, etc."
              value={settings.address?.line2 || ''}
              onChange={(e) => updateAddress('line2', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                placeholder="New York"
                value={settings.address?.city || ''}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>State/Province</Label>
              <Input
                placeholder="NY"
                value={settings.address?.state || ''}
                onChange={(e) => updateAddress('state', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                placeholder="10001"
                value={settings.address?.postalCode || ''}
                onChange={(e) => updateAddress('postalCode', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Country</Label>
            <select
              value={settings.address?.country || ''}
              onChange={(e) => updateAddress('country', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Invoice notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive email notifications when new invoices are available
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications.invoices}
                onCheckedChange={(checked) => updateNotifications('invoices', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Payment failed notifications</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when a payment fails or needs attention
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications.paymentFailed}
                onCheckedChange={(checked) => updateNotifications('paymentFailed', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Subscription changes</div>
                <div className="text-sm text-muted-foreground">
                  Receive updates about subscription plan changes and renewals
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications.subscriptionChanges}
                onCheckedChange={(checked) => updateNotifications('subscriptionChanges', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Tax rates are automatically calculated based on your billing address.
              If you're a business customer with a valid VAT number, you may be exempt
              from certain taxes.
            </p>
            <p>
              For specific tax questions or to request tax-exempt status, please
              contact our billing support team with your relevant documentation.
            </p>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tax rates vary by location and subscription type</li>
              <li>• VAT numbers are validated automatically</li>
              <li>• Tax receipts are included with all invoices</li>
              <li>• Changes may take 24-48 hours to process</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}