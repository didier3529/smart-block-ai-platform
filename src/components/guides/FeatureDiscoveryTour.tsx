import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FeatureDiscoveryTourProps {
  onComplete: () => void;
  selectedAgents: string[];
}

// Define the tour steps for each feature
const FEATURE_TOURS = {
  dashboard: [
    {
      title: 'Welcome to Your Dashboard',
      description: 'This is your command center for crypto market analysis.',
      element: '#dashboard-overview',
      content: 'Get a quick overview of market trends, your portfolio performance, and AI agent insights all in one place.'
    },
    {
      title: 'Market Overview',
      description: 'Track key market indicators and trends.',
      element: '#market-overview',
      content: 'Monitor cryptocurrency prices, trading volumes, and market sentiment in real-time.'
    },
    {
      title: 'Portfolio Summary',
      description: 'Keep track of your investments.',
      element: '#portfolio-summary',
      content: 'View your portfolio balance, asset allocation, and performance metrics at a glance.'
    }
  ],
  analysis: [
    {
      title: 'AI Analysis Hub',
      description: 'Access powerful AI-driven insights.',
      element: '#analysis-hub',
      content: 'Get detailed analysis and recommendations from your selected AI agents.'
    },
    {
      title: 'Market Signals',
      description: 'Stay informed about market opportunities.',
      element: '#market-signals',
      content: 'Receive real-time alerts and signals about potential trading opportunities.'
    },
    {
      title: 'Risk Assessment',
      description: 'Monitor and manage risk exposure.',
      element: '#risk-assessment',
      content: 'Track risk metrics and get AI-powered suggestions for portfolio optimization.'
    }
  ],
  settings: [
    {
      title: 'Agent Configuration',
      description: 'Customize your AI agents.',
      element: '#agent-config',
      content: 'Fine-tune your AI agents\' settings and preferences for better analysis.'
    },
    {
      title: 'Notification Settings',
      description: 'Stay updated on what matters.',
      element: '#notification-settings',
      content: 'Configure alerts and notifications for price movements, signals, and more.'
    },
    {
      title: 'API Connections',
      description: 'Connect your data sources.',
      element: '#api-connections',
      content: 'Manage connections to exchanges, wallets, and other data providers.'
    }
  ]
};

export function FeatureDiscoveryTour({
  onComplete,
  selectedAgents
}: FeatureDiscoveryTourProps) {
  const [currentSection, setCurrentSection] = React.useState<keyof typeof FEATURE_TOURS>('dashboard');
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [completedTours, setCompletedTours] = React.useState<Set<string>>(new Set());

  const sections = Object.keys(FEATURE_TOURS) as Array<keyof typeof FEATURE_TOURS>;
  const currentTour = FEATURE_TOURS[currentSection];
  const currentStep = currentTour[currentStepIndex];
  
  const progress = (completedTours.size / sections.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < currentTour.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Mark current section as completed
      setCompletedTours(prev => new Set([...prev, currentSection]));
      
      // Move to next section or complete
      const currentSectionIndex = sections.indexOf(currentSection);
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSection(sections[currentSectionIndex + 1]);
        setCurrentStepIndex(0);
      } else {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      // Move to previous section
      const currentSectionIndex = sections.indexOf(currentSection);
      if (currentSectionIndex > 0) {
        setCurrentSection(sections[currentSectionIndex - 1]);
        setCurrentStepIndex(FEATURE_TOURS[sections[currentSectionIndex - 1]].length - 1);
      }
    }
  };

  const handleSectionSelect = (section: keyof typeof FEATURE_TOURS) => {
    setCurrentSection(section);
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Progress value={progress} className="w-full" />
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        {sections.map((section) => (
          <Button
            key={section}
            variant={currentSection === section ? "default" : "outline"}
            className="relative"
            onClick={() => handleSectionSelect(section)}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
            {completedTours.has(section) && (
              <Badge variant="default" className="absolute -top-2 -right-2">
                <Check className="h-3 w-3" />
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScrollArea className="h-[200px] rounded-md border p-4">
            <p className="text-muted-foreground">
              {currentStep.content}
            </p>
          </ScrollArea>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentSection === sections[0] && currentStepIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentSection === sections[sections.length - 1] && 
               currentStepIndex === currentTour.length - 1 
                ? 'Complete Tour' 
                : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 