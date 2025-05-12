import {
  PromptTemplate,
  PromptVariables,
  PromptConfig,
  PromptResult,
  PromptError,
  PromptRepository
} from '../types/prompts';

export class PromptManager {
  private repository: PromptRepository;
  private cache: Map<string, PromptTemplate>;

  constructor(repository: PromptRepository) {
    this.repository = repository;
    this.cache = new Map();
  }

  private async getTemplate(id: string): Promise<PromptTemplate> {
    // Try cache first
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }

    // Fetch from repository
    const template = await this.repository.get(id);
    if (!template) {
      throw new PromptError({
        code: 'TEMPLATE_NOT_FOUND',
        message: `Prompt template with id '${id}' not found`
      });
    }

    // Cache for future use
    this.cache.set(id, template);
    return template;
  }

  private validateVariables(template: PromptTemplate, variables: PromptVariables): void {
    const missingVars = template.variables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
      throw new PromptError({
        code: 'MISSING_VARIABLES',
        message: `Missing required variables: ${missingVars.join(', ')}`,
        details: { missingVars }
      });
    }
  }

  private renderTemplate(template: string, variables: PromptVariables): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const value = variables[key.trim()];
      if (value === undefined) {
        throw new PromptError({
          code: 'VARIABLE_NOT_FOUND',
          message: `Variable '${key}' not found in provided variables`,
          details: { key }
        });
      }
      return String(value);
    });
  }

  public async render(id: string, variables: PromptVariables): Promise<string> {
    const template = await this.getTemplate(id);
    this.validateVariables(template, variables);
    return this.renderTemplate(template.template, variables);
  }

  public async clearCache(): Promise<void> {
    this.cache.clear();
  }

  public async invalidateTemplate(id: string): Promise<void> {
    this.cache.delete(id);
  }

  public async listTemplates(): Promise<PromptTemplate[]> {
    return this.repository.list();
  }

  public async addTemplate(template: PromptTemplate): Promise<void> {
    await this.repository.add(template);
    this.cache.set(template.id, template);
  }

  public async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void> {
    await this.repository.update(id, updates);
    this.cache.delete(id); // Invalidate cache
  }

  public async deleteTemplate(id: string): Promise<void> {
    await this.repository.delete(id);
    this.cache.delete(id);
  }
} 