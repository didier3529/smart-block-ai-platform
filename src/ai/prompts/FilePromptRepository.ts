import fs from 'fs/promises';
import path from 'path';
import { PromptTemplate, PromptRepository } from '../types/prompts';

export class FilePromptRepository implements PromptRepository {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  private getFilePath(id: string): string {
    return path.join(this.basePath, `${id}.json`);
  }

  public async get(id: string): Promise<PromptTemplate | null> {
    try {
      const filePath = this.getFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as PromptTemplate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  public async list(): Promise<PromptTemplate[]> {
    await this.ensureDirectory();
    const files = await fs.readdir(this.basePath);
    const templates: PromptTemplate[] = [];

    for (const file of files) {
      if (path.extname(file) === '.json') {
        try {
          const content = await fs.readFile(path.join(this.basePath, file), 'utf-8');
          templates.push(JSON.parse(content) as PromptTemplate);
        } catch (error) {
          console.error(`Error reading template file ${file}:`, error);
        }
      }
    }

    return templates;
  }

  public async add(template: PromptTemplate): Promise<void> {
    await this.ensureDirectory();
    const filePath = this.getFilePath(template.id);
    
    try {
      await fs.access(filePath);
      throw new Error(`Template with id '${template.id}' already exists`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf-8');
        return;
      }
      throw error;
    }
  }

  public async update(id: string, updates: Partial<PromptTemplate>): Promise<void> {
    const filePath = this.getFilePath(id);
    const existing = await this.get(id);
    
    if (!existing) {
      throw new Error(`Template with id '${id}' not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      version: updates.version || this.incrementVersion(existing.version)
    };

    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  }

  public async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const lastPart = parseInt(parts[parts.length - 1], 10);
    parts[parts.length - 1] = (lastPart + 1).toString();
    return parts.join('.');
  }
} 