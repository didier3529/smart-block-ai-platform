"use client";

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui";

interface GasSpeed {
  label: string;
  description: string;
  estimatedTime: string;
  gasPrice: string;
  totalFee: string;
  recommended?: boolean;
}

export interface GasEstimateProps {
  speeds: GasSpeed[];
  selectedSpeed?: string;
  onSpeedSelect?: (speed: string) => void;
  baseFee?: string;
  maxFee?: string;
  maxPriorityFee?: string;
  isLoading?: boolean;
}

export function GasEstimate({
  speeds,
  selectedSpeed,
  onSpeedSelect,
  baseFee,
  maxFee,
  maxPriorityFee,
  isLoading = false,
}: GasEstimateProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
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
            <CardTitle>Gas Estimate</CardTitle>
            <CardDescription>Select transaction speed</CardDescription>
          </div>
          {baseFee && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Info className="h-4 w-4" />
                    <span className="text-sm">Base Fee: {baseFee}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p>Current network base fee</p>
                    {maxFee && (
                      <p className="text-xs text-muted-foreground">
                        Max Fee: {maxFee}
                      </p>
                    )}
                    {maxPriorityFee && (
                      <p className="text-xs text-muted-foreground">
                        Max Priority Fee: {maxPriorityFee}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedSpeed}
          onValueChange={onSpeedSelect}
          className="space-y-3"
        >
          {speeds.map((speed) => (
            <div
              key={speed.label}
              className={cn(
                "flex items-center space-x-3 rounded-lg border p-4",
                selectedSpeed === speed.label && "border-primary"
              )}
            >
              <RadioGroupItem value={speed.label} id={speed.label} />
              <Label
                htmlFor={speed.label}
                className="flex flex-1 items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{speed.label}</span>
                    {speed.recommended && (
                      <Badge variant="secondary">Recommended</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {speed.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated time: {speed.estimatedTime}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{speed.gasPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    ≈ {speed.totalFee}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
} 