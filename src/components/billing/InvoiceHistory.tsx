import { useState, useEffect } from 'react';
import { Receipt, Download, ExternalLink, Calendar, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaymentService } from '@/services/paymentService';
import type { Invoice } from '@/services/paymentService';
import { format } from 'date-fns';

interface InvoiceHistoryProps {
  userId: string;
}

export function InvoiceHistory({ userId }: InvoiceHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    loadInvoices();
  }, [userId]);

  const loadInvoices = () => {
    const userInvoices = PaymentService.getInvoices(userId);
    setInvoices(userInvoices);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      paid: { variant: 'default' as const, label: 'Paid', icon: DollarSign },
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      failed: { variant: 'destructive' as const, label: 'Failed', icon: ExternalLink },
      draft: { variant: 'outline' as const, label: 'Draft', icon: Receipt },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.invoiceUrl) {
      window.open(invoice.invoiceUrl, '_blank');
    } else {
      // Generate a mock PDF download
      const content = `Invoice #${invoice.id}\n\nAmount: ${PaymentService.formatCurrency(invoice.amount, invoice.currency)}\nStatus: ${invoice.status}\nDate: ${format(invoice.createdAt, 'MMMM d, yyyy')}\n\nDescription: ${invoice.description}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {PaymentService.formatCurrency(totalPaid, 'USD')}
            </div>
            <div className="text-xs text-muted-foreground">Total Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {PaymentService.formatCurrency(pendingAmount, 'USD')}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {invoices.length}
            </div>
            <div className="text-xs text-muted-foreground">Total Invoices</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No invoices found</p>
              <p className="text-xs">Invoices will appear here once you have an active subscription</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-medium">
                            Invoice #{invoice.id.slice(0, 8)}
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            {PaymentService.formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(invoice.createdAt, 'MMMM d, yyyy')}
                            {invoice.status === 'pending' && (
                              <span>• Due {format(invoice.dueDate, 'MMM d')}</span>
                            )}
                          </div>
                          <div>{invoice.description}</div>
                          {invoice.paidAt && (
                            <div className="text-green-600">
                              Paid on {format(invoice.paidAt, 'MMMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        
                        {invoice.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              All invoices are automatically generated and sent to your email address.
              You can download individual invoices or access your full billing history
              through the Stripe customer portal.
            </p>
            <p>
              For any billing questions or concerns, please contact our support team.
              We're here to help with payment issues, refund requests, or plan changes.
            </p>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Need Help?</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>📧 billing@taskmanager.com</div>
              <div>💬 Live chat support</div>
              <div>📞 1-800-TASK-MGR</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}