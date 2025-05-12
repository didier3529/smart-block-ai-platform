"use client";

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, ExternalLink } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export interface WalletCardProps {
  address: string;
  balance: string;
  network: string;
  ensName?: string;
  onDisconnect?: () => void;
  onCopyAddress?: () => void;
  onViewInExplorer?: () => void;
  isLoading?: boolean;
}

export function WalletCard({
  address,
  balance,
  network,
  ensName,
  onDisconnect,
  onCopyAddress,
  onViewInExplorer,
  isLoading = false,
}: WalletCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Address</Label>
              <Skeleton className="h-8 w-full mt-1" />
            </div>
            <div>
              <Label>Balance</Label>
              <Skeleton className="h-6 w-24 mt-1" />
            </div>
            <div>
              <Label>Network</Label>
              <Skeleton className="h-6 w-20 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>
              {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
            </CardDescription>
          </div>
          <Badge variant="danger">{network}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-2xl font-bold">{balance}</div>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCopyAddress}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy address</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewInExplorer}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View in explorer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          className="w-full"
          onClick={onDisconnect}
        >
          Disconnect
        </Button>
      </CardFooter>
    </Card>
  );
} 