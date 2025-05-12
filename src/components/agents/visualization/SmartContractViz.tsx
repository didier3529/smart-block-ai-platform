import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SmartContractAnalysis } from '@/types/agents';

interface SmartContractVizProps {
  data: SmartContractAnalysis;
}

export function SmartContractViz({ data }: SmartContractVizProps) {
  const totalGasSavings = data.gasOptimizations.reduce(
    (total, opt) => total + opt.potentialSaving,
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security Analysis</CardTitle>
            <div className="flex gap-2">
              <Badge variant="danger">
                High: {data.vulnerabilities.filter(v => v.severity === 'high').length}
              </Badge>
              <Badge variant="warning">
                Medium: {data.vulnerabilities.filter(v => v.severity === 'medium').length}
              </Badge>
              <Badge variant="secondary">
                Low: {data.vulnerabilities.filter(v => v.severity === 'low').length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Accordion type="single" collapsible>
                {data.vulnerabilities.map((vuln, index) => (
                  <AccordionItem key={index} value={`vuln-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          vuln.severity === 'high' ? 'danger' :
                          vuln.severity === 'medium' ? 'warning' : 'secondary'
                        }>
                          {vuln.severity}
                        </Badge>
                        {vuln.type}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 p-4">
                        <p className="text-sm text-muted-foreground">
                          Location: {vuln.location}
                        </p>
                        <p className="text-sm">{vuln.description}</p>
                        <p className="text-sm font-medium">Recommendation:</p>
                        <p className="text-sm">{vuln.recommendation}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gas Optimizations</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Potential Savings: {totalGasSavings} gas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Accordion type="single" collapsible>
                {data.gasOptimizations.map((opt, index) => (
                  <AccordionItem key={index} value={`opt-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          opt.impact === 'high' ? 'success' :
                          opt.impact === 'medium' ? 'warning' : 'secondary'
                        }>
                          {opt.impact}
                        </Badge>
                        Save {opt.potentialSaving} gas
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 p-4">
                        <p className="text-sm text-muted-foreground">
                          Location: {opt.location}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm">Current Gas: {opt.currentGas}</p>
                          <p className="text-sm">Potential Saving: {opt.potentialSaving}</p>
                        </div>
                        <p className="text-sm">{opt.suggestion}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code Quality</CardTitle>
          <div className="flex items-center gap-2">
            <Progress value={data.codeQuality.score * 100} className="w-[100px]" />
            <span className="text-sm font-medium">{data.codeQuality.score * 100}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {data.codeQuality.issues.map((issue, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{issue.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {issue.location}
                    </span>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 