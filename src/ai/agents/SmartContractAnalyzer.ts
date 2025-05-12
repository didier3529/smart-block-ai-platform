import { BaseAgent } from '../core/BaseAgent';
import { PromptManager } from '../core/PromptManager';
import { ContractAnalyzerConfig, ContractAnalyzerState, ContractAnalysis, AgentResponse } from '../types/agents';
import { fetchContractCode, analyzeGas, scanVulnerabilities } from '../utils/contracts';
import { PerformanceManager } from '../core/PerformanceManager';

export class SmartContractAnalyzer extends BaseAgent<ContractAnalyzerConfig, ContractAnalyzerState> {
  private cache: Map<string, { analysis: ContractAnalysis; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache TTL
  private performanceManager: PerformanceManager;

  constructor(config: ContractAnalyzerConfig, promptManager: PromptManager) {
    super('smart_contract_analyzer');
    this.config = config;
    this.promptManager = promptManager;
    this.performanceManager = new PerformanceManager();
    this.state = {
      status: 'initializing',
      lastUpdate: Date.now(),
      scannedContracts: []
    };
  }

  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.config.scanParameters) {
        throw new Error('Scan parameters not configured');
      }

      // Initialize performance manager
      await this.performanceManager.initialize({
        enableMetrics: true,
        maxConcurrentOperations: 3,
        cleanupInterval: 300000 // 5 minutes
      });

      this.state.status = 'ready';
      this.state.lastUpdate = Date.now();
    } catch (error) {
      this.state.status = 'error';
      this.state.lastUpdate = Date.now();
      throw error;
    }
  }

  async analyzeContract(address: string, options: { includeGas?: boolean } = {}): Promise<AgentResponse> {
    try {
      // Input validation
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid contract address');
      }

      // Check cache
      const cached = this.cache.get(address);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return {
          type: 'contract_analysis',
          content: cached.analysis,
          metadata: {
            cached: true,
            address
          }
        };
      }

      // Fetch contract code
      const code = await this.performanceManager.executeWithRetry(
        () => fetchContractCode(address),
        {
          operation: 'fetch_contract_code',
          maxRetries: 3
        }
      );

      // Scan for vulnerabilities
      const vulnerabilities = await this.performanceManager.executeWithRetry(
        () => scanVulnerabilities(code, {
          maxDepth: this.config.scanParameters.maxDepth,
          severityThreshold: this.config.scanParameters.severityThreshold
        }),
        {
          operation: 'scan_vulnerabilities',
          maxRetries: 2
        }
      );

      // Analyze gas usage if requested
      let gasAnalysis = undefined;
      if (options.includeGas) {
        gasAnalysis = await this.performanceManager.executeWithRetry(
          () => analyzeGas(code),
          {
            operation: 'analyze_gas',
            maxRetries: 2
          }
        );
      }

      // Generate analysis with AI
      const prompt = await this.promptManager.renderPrompt('contract-analyzer-analyze', {
        code,
        vulnerabilities,
        gasAnalysis,
        config: this.config
      });

      // Process the analysis
      const analysis: ContractAnalysis = {
        vulnerabilities: vulnerabilities.map(v => ({
          severity: v.severity as 'high' | 'medium' | 'low',
          description: v.description,
          location: v.location
        })),
        gasOptimizations: options.includeGas ? gasAnalysis.recommendations : [],
        codeQuality: {
          score: this.calculateQualityScore(vulnerabilities, gasAnalysis),
          findings: this.generateQualityFindings(vulnerabilities, gasAnalysis)
        }
      };

      // Update cache and state
      this.cache.set(address, {
        analysis,
        timestamp: Date.now()
      });

      // Update state
      this.setState({
        lastAnalysis: analysis,
        scannedContracts: [...this.state.scannedContracts, address]
      });

      return {
        type: 'contract_analysis',
        content: analysis,
        metadata: {
          cached: false,
          address,
          timestamp: Date.now()
        }
      };

    } catch (error) {
      this.state.status = 'error';
      this.state.lastUpdate = Date.now();
      throw error;
    }
  }

  private calculateQualityScore(vulnerabilities: any[], gasAnalysis?: any): number {
    let score = 100;
    
    // Deduct points for vulnerabilities based on severity
    vulnerabilities.forEach(v => {
      switch (v.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for gas inefficiencies if analysis available
    if (gasAnalysis) {
      score -= Math.min(20, gasAnalysis.hotspots.length * 5);
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateQualityFindings(vulnerabilities: any[], gasAnalysis?: any): string[] {
    const findings: string[] = [];

    // Add vulnerability-based findings
    if (vulnerabilities.length === 0) {
      findings.push('No security vulnerabilities detected');
    } else {
      findings.push(`Found ${vulnerabilities.length} security issues`);
      const highSeverity = vulnerabilities.filter(v => v.severity === 'high').length;
      if (highSeverity > 0) {
        findings.push(`Critical: ${highSeverity} high severity vulnerabilities need immediate attention`);
      }
    }

    // Add gas optimization findings
    if (gasAnalysis) {
      if (gasAnalysis.hotspots.length > 0) {
        findings.push(`Identified ${gasAnalysis.hotspots.length} gas optimization opportunities`);
        if (gasAnalysis.recommendations.length > 0) {
          findings.push('Specific gas optimization recommendations available');
        }
      } else {
        findings.push('Contract is gas-optimized');
      }
    }

    return findings;
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
    await this.performanceManager.cleanup();
  }
} 