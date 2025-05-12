import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { AIAgentSelectionGuide } from './AIAgentSelectionGuide';

interface AgentOnboardingFlowProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to ChainOracle',
    description: 'Let\'s help you set up your AI agents for the best crypto analysis experience.',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          ChainOracle uses specialized AI agents to help you make better decisions in the crypto market.
          Each agent has unique capabilities, and they work even better together.
        </p>
        <div className="grid gap-4">
          <Card className="p-4">
            <h4 className="font-semibold mb-2">What to expect:</h4>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Learn about each AI agent's capabilities</li>
              <li>Choose the best agents for your needs</li>
              <li>Get recommendations for agent combinations</li>
              <li>Start analyzing the crypto market right away</li>
            </ul>
          </Card>
        </div>
      </div>
    )
  },
  {
    title: 'Choose Your AI Agents',
    description: 'Select the agents that match your crypto strategy.',
    content: null // Will be replaced with AIAgentSelectionGuide
  },
  {
    title: 'Ready to Start',
    description: 'Your AI agents are ready to help you analyze the crypto market.',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Great job! You've selected your AI agents. Here's what happens next:
        </p>
        <div className="grid gap-4">
          <Card className="p-4">
            <h4 className="font-semibold mb-2">Next steps:</h4>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Your agents will start analyzing the market</li>
              <li>You'll receive personalized insights based on your selection</li>
              <li>You can modify your agent selection anytime</li>
              <li>Check the Help Center for detailed guides on each agent</li>
            </ul>
          </Card>
        </div>
      </div>
    )
  }
];

export function AgentOnboardingFlow({ onComplete }: AgentOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>([]);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgents([...selectedAgents, agentId]);
  };

  const handleDeselectAgent = (agentId: string) => {
    setSelectedAgents(selectedAgents.filter(id => id !== agentId));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Progress value={progress} className="w-full" />
      
      <Card>
        <CardHeader>
          <CardTitle>{ONBOARDING_STEPS[currentStep].title}</CardTitle>
          <CardDescription>
            {ONBOARDING_STEPS[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 ? (
            <AIAgentSelectionGuide
              selectedAgents={selectedAgents}
              onSelectAgent={handleSelectAgent}
              onDeselectAgent={handleDeselectAgent}
            />
          ) : (
            ONBOARDING_STEPS[currentStep].content
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && selectedAgents.length === 0}
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 