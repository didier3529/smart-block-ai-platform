import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, ShieldCheck, Briefcase, ArrowRight, Check, Info, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIAgentSelectionGuideProps {
  selectedAgents: string[];
  onSelectAgent: (agentId: string) => void;
  onDeselectAgent: (agentId: string) => void;
}

// Define the available AI agents with detailed information
export const AGENT_DETAILS = [
  {
    id: 'market-analyst',
    name: 'Market Analyst',
    description: 'Analyzes market trends, price movements, and trading patterns',
    icon: <TrendingUp className="w-6 h-6" />,
    capabilities: [
      'Real-time price analysis',
      'Trading volume insights',
      'Market sentiment tracking',
      'Pattern recognition'
    ],
    bestFor: [
      'Active traders',
      'Portfolio managers',
      'Market researchers'
    ],
    useCases: [
      {
        title: 'Price Trend Analysis',
        description: 'Get detailed insights into price movements and potential future trends'
      },
      {
        title: 'Market Sentiment',
        description: 'Understand market sentiment through social media and news analysis'
      },
      {
        title: 'Volume Analysis',
        description: 'Track trading volumes and identify significant market movements'
      }
    ],
    complementaryAgents: ['portfolio-manager', 'defi-specialist']
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Evaluates smart contract security and potential vulnerabilities',
    icon: <ShieldCheck className="w-6 h-6" />,
    capabilities: [
      'Code vulnerability scanning',
      'Security best practices',
      'Risk assessment',
      'Audit report generation'
    ],
    bestFor: [
      'DeFi developers',
      'Smart contract deployers',
      'Security researchers'
    ],
    useCases: [
      {
        title: 'Smart Contract Audit',
        description: 'Analyze smart contracts for potential vulnerabilities and risks'
      },
      {
        title: 'Security Recommendations',
        description: 'Get actionable security improvement suggestions'
      },
      {
        title: 'Risk Assessment',
        description: 'Evaluate the overall security posture of blockchain projects'
      }
    ],
    complementaryAgents: ['defi-specialist']
  },
  {
    id: 'portfolio-manager',
    name: 'Portfolio Manager',
    description: 'Manages and optimizes your crypto portfolio',
    icon: <Briefcase className="w-6 h-6" />,
    capabilities: [
      'Portfolio rebalancing',
      'Risk management',
      'Performance tracking',
      'Investment suggestions'
    ],
    bestFor: [
      'Long-term investors',
      'Fund managers',
      'Passive investors'
    ],
    useCases: [
      {
        title: 'Portfolio Optimization',
        description: 'Get suggestions for optimal asset allocation and rebalancing'
      },
      {
        title: 'Risk Analysis',
        description: 'Understand and manage your portfolio risk exposure'
      },
      {
        title: 'Performance Tracking',
        description: 'Monitor your portfolio performance and get improvement suggestions'
      }
    ],
    complementaryAgents: ['market-analyst', 'defi-specialist']
  },
  {
    id: 'defi-specialist',
    name: 'DeFi Specialist',
    description: 'Focuses on decentralized finance protocols and opportunities',
    icon: <Brain className="w-6 h-6" />,
    capabilities: [
      'Yield farming analysis',
      'Liquidity pool monitoring',
      'Protocol comparison',
      'Risk/reward assessment'
    ],
    bestFor: [
      'DeFi users',
      'Yield farmers',
      'Protocol researchers'
    ],
    useCases: [
      {
        title: 'Yield Optimization',
        description: 'Find and compare the best yield farming opportunities'
      },
      {
        title: 'Protocol Analysis',
        description: 'Evaluate DeFi protocols for opportunities and risks'
      },
      {
        title: 'Liquidity Analysis',
        description: 'Monitor and analyze liquidity pools across protocols'
      }
    ],
    complementaryAgents: ['security-auditor', 'portfolio-manager']
  }
];

export function AIAgentSelectionGuide({
  selectedAgents,
  onSelectAgent,
  onDeselectAgent
}: AIAgentSelectionGuideProps) {
  const [selectedTab, setSelectedTab] = React.useState(AGENT_DETAILS[0].id);
  const [showGettingStarted, setShowGettingStarted] = React.useState(true);

  const handleAgentToggle = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onDeselectAgent(agentId);
    } else {
      onSelectAgent(agentId);
    }
  };

  const selectedAgent = AGENT_DETAILS.find(agent => agent.id === selectedTab);
  const recommendedCombinations = selectedAgent?.complementaryAgents.filter(
    agentId => !selectedAgents.includes(agentId)
  ) || [];

  return (
    <div className="space-y-6">
      {showGettingStarted && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Getting Started Tips:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Start with 1-2 agents that match your primary needs</li>
                <li>Look for the "Recommended Combinations" section to find complementary agents</li>
                <li>Each agent's capabilities are designed to work together seamlessly</li>
                <li>You can always modify your selection later</li>
              </ul>
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => setShowGettingStarted(false)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Agent Selection Guide</CardTitle>
              <CardDescription>
                Learn about our specialized AI agents and choose the best combination for your needs
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Selected: {selectedAgents.length}</span>
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>We recommend selecting 2-3 agents for optimal results</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex min-w-full p-1 lg:grid lg:grid-cols-4 gap-2">
                {AGENT_DETAILS.map(agent => (
                  <TabsTrigger
                    key={agent.id}
                    value={agent.id}
                    className="relative"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-primary/10 text-primary">
                        {agent.icon}
                      </div>
                      <span>{agent.name}</span>
                    </div>
                    {selectedAgents.includes(agent.id) && (
                      <Badge variant="default" className="absolute -top-2 -right-2">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>

            {AGENT_DETAILS.map(agent => (
              <TabsContent key={agent.id} value={agent.id} className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {agent.icon}
                        </div>
                        <div>
                          <CardTitle>{agent.name}</CardTitle>
                          <CardDescription>{agent.description}</CardDescription>
                        </div>
                      </div>
                      <Button
                        variant={selectedAgents.includes(agent.id) ? "destructive" : "default"}
                        onClick={() => handleAgentToggle(agent.id)}
                      >
                        {selectedAgents.includes(agent.id) ? 'Remove' : 'Add'} Agent
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Capabilities */}
                    <div>
                      <h4 className="font-semibold mb-2">Capabilities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {agent.capabilities.map((capability, index) => (
                          <div
                            key={index}
                            className="flex items-center text-sm text-muted-foreground"
                          >
                            <Check className="h-4 w-4 mr-1 text-primary" />
                            {capability}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Best For */}
                    <div>
                      <h4 className="font-semibold mb-2">Best For</h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.bestFor.map((user, index) => (
                          <Badge key={index} variant="secondary">
                            {user}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <h4 className="font-semibold mb-2">Common Use Cases</h4>
                      <div className="grid gap-2">
                        {agent.useCases.map((useCase, index) => (
                          <Card key={index} className="bg-muted">
                            <CardHeader className="p-3">
                              <div className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 mt-1 text-primary" />
                                <div>
                                  <div className="font-medium">{useCase.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {useCase.description}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Complementary Agents */}
                    <div>
                      <h4 className="font-semibold mb-2">
                        <div className="flex items-center gap-1">
                          Recommended Combinations
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                These agents work well together with {agent.name}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.complementaryAgents.map((agentId) => {
                          const complementaryAgent = AGENT_DETAILS.find(a => a.id === agentId);
                          if (!complementaryAgent) return null;
                          return (
                            <Badge
                              key={agentId}
                              variant={selectedAgents.includes(agentId) ? "default" : "outline"}
                              className="cursor-pointer transition-colors hover:bg-primary/10"
                              onClick={() => !selectedAgents.includes(agentId) && onSelectAgent(agentId)}
                            >
                              <div className="flex items-center gap-1">
                                {complementaryAgent.icon}
                                <span>{complementaryAgent.name}</span>
                                {selectedAgents.includes(agentId) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommendations Alert */}
                    {recommendedCombinations.length > 0 && (
                      <Alert className="bg-primary/5 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          <p className="font-medium text-primary">Enhance your analysis</p>
                          <p className="text-sm text-muted-foreground">
                            Add recommended agents to unlock more powerful insights and analysis capabilities.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 