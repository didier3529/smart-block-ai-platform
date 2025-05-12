import { PromptTemplate, PromptCategory, PromptVersion } from '../../types/prompts';

// Base templates that can be extended
const baseTemplates = {
  analysis: {
    version: '1.0.0',
    template: `You are an AI agent specialized in {{domain}} analysis.
Context: {{context}}
Task: {{task}}
Parameters: {{parameters}}

Analyze the provided information and provide insights in the following format:
1. Key Findings
2. Detailed Analysis
3. Recommendations
4. Risk Factors (if any)

Response:`,
    variables: ['domain', 'context', 'task', 'parameters']
  },
  evaluation: {
    version: '1.0.0',
    template: `You are evaluating {{target_type}} with ID {{target_id}}.
Data: {{data}}
Metrics: {{metrics}}

Provide a comprehensive evaluation covering:
1. Current Status
2. Performance Metrics
3. Comparative Analysis
4. Future Outlook

Evaluation:`,
    variables: ['target_type', 'target_id', 'data', 'metrics']
  }
};

// Specialized templates for each agent type
export const promptTemplates: Record<PromptCategory, Record<string, PromptTemplate>> = {
  portfolio_analyst: {
    'analyze-portfolio': {
      version: '1.0.0',
      extends: 'analysis',
      template: `{{parent}}

Additional Portfolio-Specific Requirements:
- Risk Assessment
- Asset Allocation Analysis
- Performance Attribution
- Rebalancing Recommendations

Analysis:`,
      variables: ['portfolio_data', 'market_conditions', 'risk_preferences']
    },
    'portfolio-rebalance': {
      version: '1.0.0',
      template: `Analyze the current portfolio allocation and suggest rebalancing actions:
Portfolio: {{portfolio_data}}
Target Allocation: {{target_allocation}}
Market Conditions: {{market_conditions}}

Provide rebalancing recommendations in the following format:
1. Current vs Target Analysis
2. Recommended Trades
3. Expected Impact
4. Risk Considerations`,
      variables: ['portfolio_data', 'target_allocation', 'market_conditions']
    }
  },
  trend_spotter: {
    'analyze-market-trends': {
      version: '1.0.0',
      extends: 'analysis',
      template: `{{parent}}

Additional Trend Analysis Requirements:
- Pattern Recognition
- Sentiment Analysis
- Volume Analysis
- Technical Indicators

Trend Analysis:`,
      variables: ['market_data', 'timeframe', 'indicators']
    },
    'sentiment-analysis': {
      version: '1.0.0',
      template: `Analyze market sentiment from the following sources:
Market Data: {{market_data}}
Social Metrics: {{social_metrics}}
News Headlines: {{news_data}}

Provide sentiment analysis in the following format:
1. Overall Sentiment Score
2. Key Sentiment Drivers
3. Sentiment Trends
4. Notable Changes`,
      variables: ['market_data', 'social_metrics', 'news_data']
    }
  },
  smart_contract_analyzer: {
    'contract-analyzer-analyze': {
      version: '1.0.0',
      extends: 'analysis',
      template: `{{parent}}

Additional Contract Analysis Requirements:
- Security Vulnerabilities
- Gas Optimization
- Code Quality Metrics
- Best Practices Compliance

Contract Analysis:`,
      variables: ['code', 'vulnerabilities', 'gas_analysis']
    },
    'audit-report': {
      version: '1.0.0',
      template: `Generate a comprehensive audit report for the smart contract:
Contract Code: {{code}}
Scan Results: {{scan_results}}
Gas Analysis: {{gas_analysis}}

Provide audit findings in the following format:
1. Critical Issues
2. High Priority Findings
3. Medium Priority Findings
4. Low Priority Findings
5. Optimization Suggestions`,
      variables: ['code', 'scan_results', 'gas_analysis']
    }
  },
  nft_advisor: {
    'nft-advisor-evaluate': {
      version: '1.0.0',
      extends: 'evaluation',
      template: `{{parent}}

Additional NFT Evaluation Requirements:
- Rarity Analysis
- Price Estimation
- Market Trend Analysis
- Collection Performance

NFT Evaluation:`,
      variables: ['nft_data', 'rarity_analysis', 'price_history']
    },
    'collection-analysis': {
      version: '1.0.0',
      template: `Analyze the NFT collection performance and metrics:
Collection Data: {{collection_data}}
Market Stats: {{market_stats}}
Trading History: {{trading_history}}

Provide collection analysis in the following format:
1. Collection Overview
2. Market Performance
3. Rarity Distribution
4. Investment Outlook`,
      variables: ['collection_data', 'market_stats', 'trading_history']
    }
  }
};

// Template inheritance resolver
export function resolveTemplate(category: PromptCategory, templateName: string, variables: Record<string, any>): string {
  const template = promptTemplates[category][templateName];
  if (!template) {
    throw new Error(`Template not found: ${category}/${templateName}`);
  }

  // Check if template extends a base template
  if (template.extends) {
    const baseTemplate = baseTemplates[template.extends];
    if (!baseTemplate) {
      throw new Error(`Base template not found: ${template.extends}`);
    }

    // Merge variables
    const mergedVariables = {
      ...variables,
      parent: resolveVariables(baseTemplate.template, variables)
    };

    return resolveVariables(template.template, mergedVariables);
  }

  return resolveVariables(template.template, variables);
}

// Variable resolution helper
function resolveVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    if (variables[variable] === undefined) {
      throw new Error(`Missing required variable: ${variable}`);
    }
    return variables[variable];
  });
}

// Template validation helper
export function validateTemplate(template: PromptTemplate): void {
  if (!template.version) {
    throw new Error('Template version is required');
  }

  if (!template.template) {
    throw new Error('Template content is required');
  }

  // Extract variables from template
  const usedVariables = Array.from(template.template.matchAll(/\{\{(\w+)\}\}/g))
    .map(match => match[1]);

  // Check if all used variables are declared
  const undeclaredVariables = usedVariables.filter(v => 
    !template.variables?.includes(v) && v !== 'parent'
  );

  if (undeclaredVariables.length > 0) {
    throw new Error(`Undeclared variables used in template: ${undeclaredVariables.join(', ')}`);
  }
}

// Template versioning helper
export function compareVersions(v1: string, v2: string): number {
  const [major1, minor1, patch1] = v1.split('.').map(Number);
  const [major2, minor2, patch2] = v2.split('.').map(Number);

  if (major1 !== major2) return major1 - major2;
  if (minor1 !== minor2) return minor1 - minor2;
  return patch1 - patch2;
}

// Documentation generator
export function generateTemplateDocumentation(): string {
  let docs = '# Prompt Template Documentation\n\n';

  // Document base templates
  docs += '## Base Templates\n\n';
  Object.entries(baseTemplates).forEach(([name, template]) => {
    docs += `### ${name}\n`;
    docs += `Version: ${template.version}\n`;
    docs += 'Variables:\n';
    template.variables.forEach(v => docs += `- ${v}\n`);
    docs += '\n';
  });

  // Document specialized templates
  docs += '## Specialized Templates\n\n';
  Object.entries(promptTemplates).forEach(([category, templates]) => {
    docs += `### ${category}\n\n`;
    Object.entries(templates).forEach(([name, template]) => {
      docs += `#### ${name}\n`;
      docs += `Version: ${template.version}\n`;
      if (template.extends) {
        docs += `Extends: ${template.extends}\n`;
      }
      docs += 'Variables:\n';
      template.variables.forEach(v => docs += `- ${v}\n`);
      docs += '\n';
    });
  });

  return docs;
} 