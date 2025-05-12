import fs from 'fs/promises';
import path from 'path';
// import { AgentState, StateStorage, StorageConfig } from '../types/state';

export class FileStorage /*implements StateStorage*/ {
  private basePath: string;

  constructor(config: any) {
    this.basePath = config.path || path.join(process.cwd(), 'data', 'states');
    this.ensureDir();
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      // Ignore if already exists
    }
  }

  private getFilePath(agentId: string): string {
    return path.join(this.basePath, `${agentId}.json`);
  }

  async save(agentId: string, state: any): Promise<void> {
    const filePath = this.getFilePath(agentId);
    try {
      await fs.writeFile(
        filePath,
        JSON.stringify(state, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save state for agent ${agentId}: ${error.message}`);
    }
  }

  async load(agentId: string): Promise<any | null> {
    const filePath = this.getFilePath(agentId);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as any;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to load state for agent ${agentId}: ${error.message}`);
    }
  }

  async delete(agentId: string): Promise<void> {
    const filePath = this.getFilePath(agentId);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to delete state for agent ${agentId}: ${error.message}`);
      }
    }
  }

  async list(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      throw new Error(`Failed to list agent states: ${error.message}`);
    }
  }

  async read(filename: string): Promise<any> {
    await this.ensureDir();
    const filePath = path.join(this.basePath, filename);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { entries: [] };
      }
      throw new Error(`Failed to read file ${filename}: ${error.message}`);
    }
  }

  async write(filename: string, data: any): Promise<void> {
    await this.ensureDir();
    const filePath = path.join(this.basePath, filename);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filename}: ${error.message}`);
    }
  }

  async exists(filename: string): Promise<boolean> {
    await this.ensureDir();
    const filePath = path.join(this.basePath, filename);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
} 