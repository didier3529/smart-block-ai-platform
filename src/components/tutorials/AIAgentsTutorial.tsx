import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Lightbulb, MessageSquare, Target, Zap, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIAgentsTutorialProps {
  selectedAgents: string[];
  selectedAgentDetails: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
  }>;
  recommendedAgents: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
  }>;
}

export function AIAgentsTutorial({
  selectedAgents,
  selectedAgentDetails,
  recommendedAgents
}: AIAgentsTutorialProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Understanding AI Agents
        </CardTitle>
        <CardDescription>
          Learn about the different AI agents and their specialized capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">How AI Agents Work</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <p className="font-medium">Specialized Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Each AI agent is trained on specific aspects of blockchain and crypto markets.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 mt-1 text-primary" />
                  <div>
                    <p className="font-medium">Focused Expertise</p>
                    <p className="text-sm text-muted-foreground">
                      Agents provide deep insights in their specialized domains, from technical analysis to risk assessment.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Pro Tip: Combine multiple agents with complementary skills for comprehensive market analysis.
              </AlertDescription>
            </Alert>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Agent Capabilities</h3>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Analysis Types</h4>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <span className="font-medium">Market Analysis</span>
                        <p className="text-sm text-muted-foreground">Price trends, volume analysis, and market sentiment</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <span className="font-medium">Technical Indicators</span>
                        <p className="text-sm text-muted-foreground">Moving averages, RSI, and other technical signals</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 mt-1 text-primary" />
                      <div>
                        <span className="font-medium">Risk Assessment</span>
                        <p className="text-sm text-muted-foreground">Portfolio risk analysis and security recommendations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Your Selected Agents</h3>
              {selectedAgentDetails.length > 0 ? (
                <div className="grid gap-3">
                  {selectedAgentDetails.map(agent => (
                    <div key={agent.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="mt-1">{agent.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{agent.name}</p>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No agents selected yet. Choose agents from the setup tab to get started.
                </p>
              )}
            </section>

            {recommendedAgents.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold">Recommended Agents</h3>
                <div className="grid gap-3">
                  {recommendedAgents.map(agent => (
                    <div key={agent.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="mt-1">{agent.icon}</div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Best Practices</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Start with 2-3 complementary agents</li>
                  <li>Consider your investment strategy when selecting agents</li>
                  <li>Review agent recommendations regularly</li>
                  <li>Adjust your agent selection as your needs change</li>
                </ul>
              </div>
            </section>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 