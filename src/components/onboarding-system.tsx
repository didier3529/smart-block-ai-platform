"use client";

import React, { useState } from 'react';
import { SimpleDialog } from '@/components/ui/simple-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { WalletConnectionTutorial } from '@/components/tutorials/WalletConnectionTutorial';
import { AIAgentsTutorial } from '@/components/tutorials/AIAgentsTutorial';
import { PortfolioOverviewTutorial } from '@/components/tutorials/PortfolioOverviewTutorial';
import { AIAnalysisTutorial } from '@/components/tutorials/AIAnalysisTutorial';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentOnboardingFlow } from './guides/AgentOnboardingFlow';
import { FeatureDiscoveryTour } from './guides/FeatureDiscoveryTour';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSelectedAgents } from '@/hooks/use-selected-agents';

interface OnboardingSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  walletConnected: boolean;
  onConnectWallet: () => void;
  walletAddress?: string;
}

type TutorialStep = 'welcome' | 'wallet' | 'agents' | 'portfolio' | 'analysis' | 'tour' | 'complete';

export function OnboardingSystem({
  isOpen,
  onClose,
  onComplete,
  walletConnected,
  onConnectWallet,
  walletAddress,
}: OnboardingSystemProps) {
  const [currentStep, setCurrentStep] = useState<TutorialStep>('welcome');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage('hasCompletedOnboarding', false);
  const {
    selectedAgents,
    addAgent,
    removeAgent,
    getSelectedAgentDetails,
    getRecommendedAgents
  } = useSelectedAgents();

  const handleStepComplete = (nextStep: TutorialStep) => {
    setCurrentStep(nextStep);
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    onComplete();
  };

  if (hasCompletedOnboarding) {
    const selectedDetails = getSelectedAgentDetails();
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>
            Continue exploring Smart Block AI's features or modify your AI agent selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDetails.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Your Active AI Agents:</h4>
              <div className="grid gap-2">
                {selectedDetails.map(agent => (
                  <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-primary/10 text-primary">
                        {agent.icon}
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">{agent.description}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAgent(agent.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('tour')}
            >
              Feature Tour
            </Button>
            <Button
              variant="outline"
              onClick={() => setHasCompletedOnboarding(false)}
            >
              Restart Onboarding
            </Button>
            {selectedDetails.length === 0 && (
              <Button
                onClick={() => setHasCompletedOnboarding(false)}
              >
                Select AI Agents
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {isOpen && (
        <SimpleDialog
          isOpen={true}
          onClose={onClose}
          title={
            currentStep === 'welcome'
              ? 'Welcome to Smart Block AI'
              : currentStep === 'wallet'
              ? 'Connect Your Wallet'
              : currentStep === 'agents'
              ? 'Choose Your AI Agents'
              : currentStep === 'portfolio'
              ? 'Portfolio Overview'
              : currentStep === 'analysis'
              ? 'AI Analysis Features'
              : currentStep === 'tour'
              ? 'Feature Discovery'
              : 'Getting Started'
          }
        >
          {currentStep === 'welcome' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Get Started with Smart Block AI</CardTitle>
                  <CardDescription>
                    Your AI-powered blockchain assistant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Welcome to Smart Block AI! Let's get you set up with everything you need to start analyzing blockchain data with AI assistance.
                  </p>
                  <Button onClick={() => handleStepComplete('wallet')} className="w-full">
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'wallet' && (
            <WalletConnectionTutorial
              walletConnected={walletConnected}
              onConnectWallet={onConnectWallet}
              walletAddress={walletAddress}
              onComplete={() => handleStepComplete('agents')}
            />
          )}

          {currentStep === 'agents' && (
            <Tabs defaultValue="setup">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="learn">Learn</TabsTrigger>
              </TabsList>
              <TabsContent value="setup">
                <AgentOnboardingFlow
                  onComplete={() => handleStepComplete('portfolio')}
                  selectedAgents={selectedAgents}
                  onSelectAgent={addAgent}
                  onDeselectAgent={removeAgent}
                />
              </TabsContent>
              <TabsContent value="learn">
                <AIAgentsTutorial
                  selectedAgents={selectedAgents}
                  selectedAgentDetails={getSelectedAgentDetails()}
                  recommendedAgents={getRecommendedAgents()}
                />
              </TabsContent>
            </Tabs>
          )}

          {currentStep === 'portfolio' && (
            <PortfolioOverviewTutorial
              onComplete={() => handleStepComplete('analysis')}
            />
          )}

          {currentStep === 'analysis' && (
            <AIAnalysisTutorial
              onComplete={() => handleStepComplete('tour')}
              selectedAgents={selectedAgents}
            />
          )}

          {currentStep === 'tour' && (
            <FeatureDiscoveryTour
              onComplete={handleOnboardingComplete}
              selectedAgents={selectedAgents}
            />
          )}
        </SimpleDialog>
      )}
    </>
  );
} 