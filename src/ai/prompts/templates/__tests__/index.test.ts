import { promptTemplates, resolveTemplate, validateTemplate, compareVersions, generateTemplateDocumentation } from '../index';
import { PromptTemplate } from '../../../types/prompts';

describe('Prompt Template System', () => {
  describe('Template Resolution', () => {
    it('should resolve simple templates', () => {
      const result = resolveTemplate('portfolio_analyst', 'portfolio-rebalance', {
        portfolio_data: 'test portfolio',
        target_allocation: 'test allocation',
        market_conditions: 'test conditions'
      });

      expect(result).toContain('test portfolio');
      expect(result).toContain('test allocation');
      expect(result).toContain('test conditions');
    });

    it('should resolve inherited templates', () => {
      const result = resolveTemplate('trend_spotter', 'analyze-market-trends', {
        domain: 'market trend',
        context: 'test context',
        task: 'test task',
        parameters: 'test parameters',
        market_data: 'test data',
        timeframe: '1d',
        indicators: 'RSI, MACD'
      });

      expect(result).toContain('market trend analysis');
      expect(result).toContain('test context');
      expect(result).toContain('test task');
      expect(result).toContain('test data');
      expect(result).toContain('Pattern Recognition');
    });

    it('should throw error for missing variables', () => {
      expect(() => resolveTemplate('portfolio_analyst', 'portfolio-rebalance', {
        portfolio_data: 'test'
        // Missing required variables
      })).toThrow('Missing required variable');
    });

    it('should throw error for non-existent template', () => {
      expect(() => resolveTemplate('portfolio_analyst', 'non-existent', {}))
        .toThrow('Template not found');
    });
  });

  describe('Template Validation', () => {
    it('should validate correct templates', () => {
      const template: PromptTemplate = {
        version: '1.0.0',
        template: 'Test {{var1}} and {{var2}}',
        variables: ['var1', 'var2']
      };

      expect(() => validateTemplate(template)).not.toThrow();
    });

    it('should detect missing version', () => {
      const template = {
        template: 'Test',
        variables: []
      } as PromptTemplate;

      expect(() => validateTemplate(template)).toThrow('version is required');
    });

    it('should detect missing template content', () => {
      const template = {
        version: '1.0.0',
        variables: []
      } as PromptTemplate;

      expect(() => validateTemplate(template)).toThrow('content is required');
    });

    it('should detect undeclared variables', () => {
      const template: PromptTemplate = {
        version: '1.0.0',
        template: 'Test {{var1}} and {{var2}}',
        variables: ['var1'] // var2 is missing
      };

      expect(() => validateTemplate(template)).toThrow('Undeclared variables');
    });
  });

  describe('Version Comparison', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.1.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.1', '1.0.0')).toBeGreaterThan(0);
    });
  });

  describe('Documentation Generation', () => {
    it('should generate documentation with all templates', () => {
      const docs = generateTemplateDocumentation();

      // Check base templates
      expect(docs).toContain('# Prompt Template Documentation');
      expect(docs).toContain('## Base Templates');
      expect(docs).toContain('### analysis');
      expect(docs).toContain('### evaluation');

      // Check specialized templates
      expect(docs).toContain('## Specialized Templates');
      expect(docs).toContain('### portfolio_analyst');
      expect(docs).toContain('### trend_spotter');
      expect(docs).toContain('### smart_contract_analyzer');
      expect(docs).toContain('### nft_advisor');
    });

    it('should include version and variable information', () => {
      const docs = generateTemplateDocumentation();

      expect(docs).toContain('Version: 1.0.0');
      expect(docs).toContain('Variables:');
      expect(docs).toContain('Extends:');
    });
  });

  describe('Template Coverage', () => {
    it('should have templates for all agent types', () => {
      expect(promptTemplates).toHaveProperty('portfolio_analyst');
      expect(promptTemplates).toHaveProperty('trend_spotter');
      expect(promptTemplates).toHaveProperty('smart_contract_analyzer');
      expect(promptTemplates).toHaveProperty('nft_advisor');
    });

    it('should have required templates for each agent', () => {
      // Portfolio Analyst
      expect(promptTemplates.portfolio_analyst).toHaveProperty('analyze-portfolio');
      expect(promptTemplates.portfolio_analyst).toHaveProperty('portfolio-rebalance');

      // Trend Spotter
      expect(promptTemplates.trend_spotter).toHaveProperty('analyze-market-trends');
      expect(promptTemplates.trend_spotter).toHaveProperty('sentiment-analysis');

      // Smart Contract Analyzer
      expect(promptTemplates.smart_contract_analyzer).toHaveProperty('contract-analyzer-analyze');
      expect(promptTemplates.smart_contract_analyzer).toHaveProperty('audit-report');

      // NFT Advisor
      expect(promptTemplates.nft_advisor).toHaveProperty('nft-advisor-evaluate');
      expect(promptTemplates.nft_advisor).toHaveProperty('collection-analysis');
    });
  });
}); 