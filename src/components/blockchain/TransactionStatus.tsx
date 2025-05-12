"use client";

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed';

export interface TransactionStatusProps {
  status: TransactionStatus;
  hash: string;
  confirmations?: number;
  requiredConfirmations?: number;
  error?: string;
  timestamp?: string;
  onViewInExplorer?: () => void;
}

export function TransactionStatus({
  status,
  hash,
  confirmations = 0,
  requiredConfirmations = 12,
  error,
  timestamp,
  onViewInExplorer,
}: TransactionStatusProps) {
  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          variant: 'warning' as const,
          label: 'Pending',
          description: 'Transaction is waiting to be mined',
        };
      case 'processing':
        return {
          icon: <Clock className="h-5 w-5" />,
          variant: 'secondary' as const,
          label: 'Processing',
          description: 'Transaction is being processed',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          variant: 'success' as const,
          label: 'Success',
          description: 'Transaction was successful',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-5 w-5" />,
          variant: 'danger' as const,
          label: 'Failed',
          description: error || 'Transaction failed',
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          variant: 'default' as const,
          label: 'Unknown',
          description: 'Unknown status',
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const progress = Math.min(
    (confirmations / requiredConfirmations) * 100,
    100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Status</CardTitle>
        <CardDescription>Current status and details of your transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Badge variant={statusConfig.variant} className="ml-2">
              {statusConfig.label}
            </Badge>
          </div>
          <div>
            <Label>Transaction Hash</Label>
            <div className="mt-1">
              <code className="text-sm break-all bg-muted p-2 rounded-md">
                {hash}
              </code>
            </div>
          </div>
          <div>
            <Label>Confirmations</Label>
            <Progress 
              value={progress} 
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {confirmations} of {requiredConfirmations} confirmations
            </p>
          </div>
          <div>
            <Label>Timestamp</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {timestamp || "Processing..."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 