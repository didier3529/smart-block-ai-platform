import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Lightbulb, ArrowRight, MessageSquare, ChartBar, Shield } from 'lucide-react';

interface AIAnalysisTutorialProps {
  onComplete?: () => void;
  selectedAgents: string[];
}

export function AIAnalysisTutorial({ onComplete, selectedAgents }: AIAnalysisTutorialProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Analysis Tutorial
        </CardTitle>
        <CardDescription>
          Learn how to leverage AI agents for advanced crypto market analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">AI Analysis Dashboard</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <ChartBar className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <p className="font-medium">Market Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Get real-time market insights and trend analysis from your AI agents.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <p className="font-medium">Risk Assessment</p>
                    <p className="text-sm text-muted-foreground">
                      Receive AI-powered risk analysis and security recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Pro Tip: Combine insights from multiple AI agents to get a more comprehensive analysis of market conditions.
              </AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Interacting with AI Agents</h3>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Asking Questions</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Type your question in the chat interface</li>
                    <li>AI agents will analyze relevant blockchain data</li>
                    <li>Receive detailed insights and recommendations</li>
                  </ol>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Analysis Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>Market sentiment analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>Technical indicators</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>On-chain metrics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>Smart contract analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Your Active AI Agents</h3>
              <div className="space-y-2">
                {selectedAgents.length > 0 ? (
                  <div className="grid gap-2">
                    {selectedAgents.map((agentId) => (
                      <div key={agentId} className="flex items-center gap-2 text-sm">
                        <Brain className="h-4 w-4 text-primary" />
                        <span>{agentId}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No AI agents selected yet. Return to the agent selection screen to choose your analysis team.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Best Practices</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Ask specific, focused questions for better results</li>
                  <li>Provide context when requesting analysis</li>
                  <li>Cross-reference insights from multiple agents</li>
                  <li>Save important analyses for future reference</li>
                </ul>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="mt-6 flex justify-end">
          <Button onClick={onComplete} className="flex items-center gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 