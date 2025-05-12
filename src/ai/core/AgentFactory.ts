import { BaseAgent } from './BaseAgent';
import { PortfolioAnalyst } from '../agents/PortfolioAnalyst';
import { AgentConfig, AgentType } from '../types';
import {
  PortfolioAnalystConfig,
  TrendSpotterConfig,
  ContractAnalyzerConfig,
  NFTAdvisorConfig
} from '../types/agents';

export class AgentFactory {
  private static instance: AgentFactory;
  private agents: Map<string, BaseAgent<any, any>> = new Map();

  private constructor() {}

  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }

  public async createAgent(type: AgentType, config: AgentConfig): Promise<BaseAgent<any, any>> {
    const agentId = `${type}-${Date.now()}`;
    
    let agent: BaseAgent<any, any>;

    switch (type) {
      case 'portfolio-analyst':
        agent = new PortfolioAnalyst(config as PortfolioAnalystConfig);
        break;
      // TODO: Implement other agent types
      // case 'trend-spotter':
      //   agent = new TrendSpotter(config as TrendSpotterConfig);
      //   break;
      // case 'contract-analyzer':
      //   agent = new ContractAnalyzer(config as ContractAnalyzerConfig);
      //   break;
      // case 'nft-advisor':
      //   agent = new NFTAdvisor(config as NFTAdvisorConfig);
      //   break;
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }

    await agent.initialize();
    this.agents.set(agentId, agent);
    return agent;
  }

  public getAgent(agentId: string): BaseAgent<any, any> | undefined {
    return this.agents.get(agentId);
  }

  public async destroyAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      await agent.cleanup();
      this.agents.delete(agentId);
    }
  }

  public getActiveAgents(): Array<{ id: string; agent: BaseAgent<any, any> }> {
    return Array.from(this.agents.entries()).map(([id, agent]) => ({ id, agent }));
  }
} 