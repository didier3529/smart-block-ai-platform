import { BaseAgent } from '../core/BaseAgent';
import { AgentState, AgentConfig } from './index';
// import { AgentConfig, AgentState } from './agents';

export interface AgentRegistry {
  agents: Map<string, BaseAgent<any, any>>;
  configs: Map<string, AgentConfig>;
  states: Map<string, AgentState>;
}

export interface TaskDistribution {
  agentId: string;
  taskId: string;
  priority: number;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  error?: Error;
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'event';
  payload: any;
  timestamp: number;
  correlationId: string;
}

export interface OrchestrationConfig {
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
} 