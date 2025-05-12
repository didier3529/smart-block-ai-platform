import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { Agent } from '@/types/agents';

interface AgentCardProps {
  agent: Agent;
  onSelect?: () => void;
  onConfigure?: () => void;
}

export function AgentCard({ agent, onSelect, onConfigure }: AgentCardProps) {
  return (
    <Card className="w-full max-w-sm transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{agent.name}</CardTitle>
          <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
            {agent.status}
          </Badge>
        </div>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Performance</span>
              <span>{agent.performance}%</span>
            </div>
            <Progress value={agent.performance} />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((capability) => (
              <Tooltip key={capability} content={`Supports ${capability}`}>
                <Badge variant="outline">{capability}</Badge>
              </Tooltip>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onConfigure}>
          Configure
        </Button>
        <Button onClick={onSelect}>Select Agent</Button>
      </CardFooter>
    </Card>
  );
} 