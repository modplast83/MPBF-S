import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Settings, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function EmailConfiguration() {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/test-email-config');
      return response.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error: any) => {
      setTestResult({
        success: false,
        message: error.message || 'Failed to test email configuration'
      });
    }
  });

  const sendTestQuoteMutation = useMutation({
    mutationFn: () => 
      fetch('/api/send-quote-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+966501234567'
          },
          productType: 'Custom Plastic Bags',
          template: 'Standard Template',
          materialColor: 'White',
          quantity: 1000,
          dimensions: {
            width: 30,
            length: 40,
            gusset: 10,
            thickness: 0.05
          },
          clichesCost: 600,
          bagsCost: 3000,
          minimumKg: 300,
          numberOfColors: 2,
          estimatedCost: 3600,
          notes: 'This is a test quote request to verify email functionality.',
          timestamp: new Date().toISOString()
        })
      }).then(res => res.json()),
    onSuccess: (data) => {
      setTestResult(data);
    },
    onError: (error: any) => {
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test quote'
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email Service Configuration</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              SendGrid Status
            </CardTitle>
            <CardDescription>
              Current email service configuration and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">API Key</span>
                <Badge variant="secondary">Configured</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sender Email</span>
                <span className="text-sm text-muted-foreground">Modplast83@gmail.com</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Recipient Email</span>
                <span className="text-sm text-muted-foreground">Modplast83@gmail.com</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => testEmailMutation.mutate()}
                disabled={testEmailMutation.isPending}
                className="w-full"
              >
                {testEmailMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Email Test</CardTitle>
            <CardDescription>
              Send a test quote email to verify full functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p><strong>Test Quote Details:</strong></p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Customer: Test Customer</li>
                <li>Product: Custom Plastic Bags</li>
                <li>Quantity: 1,000 pieces</li>
                <li>Colors: 2 colors</li>
                <li>Total Cost: 3,600 SR</li>
              </ul>
            </div>

            <Button
              onClick={() => sendTestQuoteMutation.mutate()}
              disabled={sendTestQuoteMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {sendTestQuoteMutation.isPending ? 'Sending...' : 'Send Test Quote'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {testResult && (
        <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              {testResult.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Troubleshooting Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">403 Forbidden Error</h4>
              <p className="text-sm text-muted-foreground">
                This error indicates the sender email address needs to be verified in your SendGrid account.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">401 Unauthorized Error</h4>
              <p className="text-sm text-muted-foreground">
                The SendGrid API key is invalid or has been revoked. Generate a new API key.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-sm">To verify sender email:</h4>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Log into your SendGrid dashboard</li>
                <li>Go to Settings → Sender Authentication</li>
                <li>Add and verify "Modplast83@gmail.com"</li>
                <li>Check your email for verification link</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-sm">Alternative Solution:</h4>
              <p className="text-sm text-muted-foreground">
                If verification is not possible, you can use Domain Authentication instead of Single Sender Verification in SendGrid.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}