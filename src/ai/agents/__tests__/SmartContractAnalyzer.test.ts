import { SmartContractAnalyzer } from '../SmartContractAnalyzer';
import { PromptManager } from '../../core/PromptManager';
import { ContractAnalyzerConfig, ContractAnalysis } from '../../types/agents';
import { fetchContractCode, analyzeGas, scanVulnerabilities } from '../../utils/contracts';

// Mock dependencies
jest.mock('../../utils/contracts');
jest.mock('../../core/PromptManager');

describe('SmartContractAnalyzer', () => {
  let analyzer: SmartContractAnalyzer;
  let mockPromptManager: jest.Mocked<PromptManager>;
  let mockConfig: ContractAnalyzerConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock config
    mockConfig = {
      capabilities: ['code analysis', 'vulnerability detection', 'gas optimization'],
      scanParameters: {
        maxDepth: 3,
        severityThreshold: 'medium'
      },
      modelConfig: {
        temperature: 0.7,
        maxTokens: 1000
      }
    };

    // Setup mock PromptManager
    mockPromptManager = new PromptManager() as jest.Mocked<PromptManager>;
    mockPromptManager.renderPrompt = jest.fn().mockResolvedValue('Mocked prompt');

    // Initialize agent
    analyzer = new SmartContractAnalyzer(mockConfig, mockPromptManager);
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await expect(analyzer.initialize()).resolves.not.toThrow();
      expect(analyzer.getState().status).toBe('ready');
    });

    it('should throw error if scan parameters are not configured', async () => {
      const invalidConfig = {
        ...mockConfig,
        scanParameters: undefined
      };
      const invalidAnalyzer = new SmartContractAnalyzer(invalidConfig, mockPromptManager);
      
      await expect(invalidAnalyzer.initialize()).rejects.toThrow('Scan parameters not configured');
      expect(invalidAnalyzer.getState().status).toBe('error');
    });
  });

  describe('contract analysis', () => {
    const mockContractCode = `
      contract TestToken {
        mapping(address => uint256) balances;
        
        function transfer(address to, uint256 amount) public {
          require(balances[msg.sender] >= amount);
          balances[msg.sender] -= amount;
          balances[to] += amount;
        }
      }
    `;

    const mockVulnerabilities = [
      {
        severity: 'high',
        description: 'Integer overflow in transfer function',
        location: 'line 6'
      },
      {
        severity: 'medium',
        description: 'Missing event emission',
        location: 'line 4-7'
      }
    ];

    const mockGasAnalysis = {
      hotspots: [
        { function: 'transfer', gasUsed: 21000, optimization: 'Use unchecked block' }
      ],
      recommendations: ['Replace require with custom errors']
    };

    beforeEach(() => {
      // Mock contract utility functions
      (fetchContractCode as jest.Mock).mockResolvedValue(mockContractCode);
      (scanVulnerabilities as jest.Mock).mockResolvedValue(mockVulnerabilities);
      (analyzeGas as jest.Mock).mockResolvedValue(mockGasAnalysis);
    });

    it('should analyze contract successfully', async () => {
      await analyzer.initialize();
      const response = await analyzer.analyzeContract('0x123...');

      expect(response.type).toBe('contract_analysis');
      expect(response.content).toHaveProperty('vulnerabilities');
      expect(response.content).toHaveProperty('gasOptimizations');
      expect(response.content).toHaveProperty('codeQuality');
    });

    it('should detect vulnerabilities above severity threshold', async () => {
      await analyzer.initialize();
      const response = await analyzer.analyzeContract('0x123...');

      const highSeverityVulns = response.content.vulnerabilities.filter(
        v => v.severity === 'high'
      );
      expect(highSeverityVulns.length).toBeGreaterThan(0);
    });

    it('should provide gas optimization recommendations', async () => {
      await analyzer.initialize();
      const response = await analyzer.analyzeContract('0x123...', { includeGas: true });

      expect(mockPromptManager.renderPrompt).toHaveBeenCalledWith(
        'contract-analyzer-analyze',
        expect.objectContaining({
          gasAnalysis: expect.any(Object)
        }),
        expect.any(Object)
      );
    });
  });

  describe('state management', () => {
    it('should update state with last analysis', async () => {
      await analyzer.initialize();
      await analyzer.analyzeContract('0x123...');

      const state = analyzer.getState();
      expect(state).toHaveProperty('lastAnalysis');
      expect(state.lastAnalysis).toHaveProperty('vulnerabilities');
      expect(state.lastAnalysis).toHaveProperty('codeQuality');
    });

    it('should maintain scanned contracts list', async () => {
      await analyzer.initialize();
      const state = analyzer.getState();
      expect(state.scannedContracts).toEqual([]);
      // Test adding contracts to scanned list if those methods exist
    });
  });

  describe('error handling', () => {
    it('should handle contract fetch errors', async () => {
      await analyzer.initialize();
      (fetchContractCode as jest.Mock).mockRejectedValue(new Error('Contract not found'));

      await expect(analyzer.analyzeContract('0x123...')).rejects.toThrow('Contract not found');
      expect(analyzer.getState().status).toBe('error');
    });

    it('should handle invalid contract address', async () => {
      await analyzer.initialize();
      await expect(analyzer.analyzeContract('invalid')).rejects.toThrow();
    });

    it('should handle vulnerability scan failures', async () => {
      await analyzer.initialize();
      (scanVulnerabilities as jest.Mock).mockRejectedValue(new Error('Scan failed'));

      await expect(analyzer.analyzeContract('0x123...')).rejects.toThrow('Scan failed');
      expect(analyzer.getState().status).toBe('error');
    });
  });

  describe('performance optimization', () => {
    it('should cache contract analysis results', async () => {
      await analyzer.initialize();
      
      // First analysis
      await analyzer.analyzeContract('0x123...');
      expect(fetchContractCode).toHaveBeenCalledTimes(1);
      
      // Second analysis within cache window
      await analyzer.analyzeContract('0x123...');
      expect(fetchContractCode).toHaveBeenCalledTimes(1); // Should use cached results
    });

    it('should respect max depth parameter', async () => {
      await analyzer.initialize();
      await analyzer.analyzeContract('0x123...');

      expect(scanVulnerabilities).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxDepth: mockConfig.scanParameters.maxDepth
        })
      );
    });
  });
}); 